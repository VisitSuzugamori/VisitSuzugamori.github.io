const got = require('got');
const u = require('./common.js');

class TwitterApi {
  constructor(config) {
    this.token = config.bearer_token;
    const { keyword, query_param, radius, api_version, product_track, search_type, dry_run } = config;
    this.keyword = keyword || '';
    this.query_param = query_param;
    this.radius = radius || '0.1km';
    this.api_version = api_version || 1.1;
    this.product_track = product_track || 'Standard';
    this.search_type = search_type || '';
    this.dry_run = dry_run || false;
    this.banned_user_screen_name = new Set();
    this.banned_tweet_id = new Set();
    this.endpoint = new Map([
      [
        1.1,
        new Map([
          [
            'Standard',
            new Map([
              ['search_recent', '1.1/search/tweets.json'],
              ['search_full', ''],
              ['rate_limit_status', '1.1/application/rate_limit_status.json'],
            ]),
          ],
          [
            'Premium_Sandbox',
            new Map([
              ['search_recent', '1.1/search/tweets.json'],
              ['search_full_dev', '1.1/tweets/search/fullarchive/dev.json'], // development_environment: dev
              ['rate_limit_status', '1.1/application/rate_limit_status.json'],
            ]),
          ],
        ]),
      ],
      [
        2,
        new Map([
          [
            'Standard',
            new Map([
              ['search_recent', '2/tweets/search/recent'],
              ['search_full', ''],
            ]),
          ],
          [
            'Premium_Sandbox',
            new Map([
              ['search_recent', '2/tweets/search/recent'],
              ['search_full', '2/tweets/search/all'],
            ]),
          ],
        ]),
      ],
    ]);
    this.deduped_tweets = new Set();
    this.api_cache = new Map();
  }

  setBlockList(blocklist) {
    this.banned_tweet_id = blocklist.get('banned_tweet_id');
    this.banned_user_screen_name = blocklist.get('banned_user_screen_name');
  }

  getClient() {
    return got.extend({
      responseType: 'json',
      prefixUrl: 'https://api.twitter.com/',
      headers: {
        'User-Agent': 'isnot/VisitSuzugamori/searchTweets',
        Authorization: `Bearer ${this.token}`,
      },
    });
  }

  getEndpoint(version, product_track, search_type) {
    return this.endpoint.get(version).get(product_track).get(search_type);
  }

  async getSearchRateLimitStatus() {
    const api = this.getClient();
    const endpoint = this.getEndpoint(this.api_version, this.product_track, 'rate_limit_status');
    try {
      const res = await api(endpoint, { searchParams: { resources: 'search' } }).catch((e) => {
        throw e;
      });
      const st = res.body.resources.search['/search/tweets'];
      st.reset_until = st.reset - parseInt(Date.now() / 1000, 10);
      return st;
    } catch (e) {
      return undefined;
    }
  }

  async getTweetIdByGeo(options = {}) {
    try {
      const res = await this.searchGeo(options);
      const data = options.search_type === 'search_full_dev' ? res.results : res.statuses;
      if (data.length > 0) {
        const tweet = this.findSpecificTweet(data, options);
        return tweet ? tweet.id_str : undefined;
      }
      return undefined;
    } catch (e) {
      console.log('exception', e);
      return undefined;
    }
  }

  async searchGeo(options = {}) {
    // latlon: [137, 39], <place>, 'search_full_dev'
    const { latlon, additional_keyword, search_type } = options;
    const api = this.getClient();
    const endpoint = this.getEndpoint(this.api_version, this.product_track, search_type);
    const params = this.setupParams(latlon, additional_keyword, search_type);
    if (this.dry_run) {
      return {
        is_dry_run: this.dry_run,
        endpoint,
        ...params,
      };
    }

    const cache_key = `${additional_keyword}_${latlon.join('_')}`;
    if (this.api_cache.has(cache_key)) {
      const cached = await this.api_cache.get(cache_key);
      return cached.body;
    }
    const res_promise = api(endpoint, { searchParams: params }).catch((e) => {
      throw e;
    });
    this.api_cache.set(cache_key, res_promise);
    const res = await res_promise;
    return res.body;
  }

  setupParams(latlon, additional_keyword, search_type) {
    const V2 = {
      query: `${this.keyword} OR ${additional_keyword} ${this.query_param} point_radius:[${latlon[0]} ${latlon[1]} ${this.radius}]`,
      'place.fields': 'contained_within,full_name,geo,id,name,place_type',
      'media.fields': 'height,media_key,preview_image_url,type,url,width',
      'user.fields': 'created_at,id,name,profile_image_url,protected,username,verified',
      'tweet.fields': 'attachments,author_id,created_at,geo,id,lang,possibly_sensitive,text',
    };
    const V1_Premium = {
      query: `${this.keyword} OR ${additional_keyword} ${this.query_param} point_radius:[${latlon[0]} ${latlon[1]} ${this.radius}]`,
      maxResults: 5,
      fromDate: '201502170000',
    };
    const V1_Standard = {
      q: `${this.keyword} OR ${additional_keyword} filter:media`,
      geocode: `${latlon[1]},${latlon[0]},${this.radius}`,
      lang: 'ja',
      include_entities: 'false',
      count: 100,
      result_type: 'recent',
    };
    return new Map([
      ['1.1_search_recent', V1_Standard],
      ['1.1_search_full_dev', V1_Premium],
      ['2_search_recent', V2],
      ['2_search_full', V2],
      ['2_search_full_dev', V2],
    ]).get(`${this.api_version}_${search_type}`);
  }

  findSpecificTweet(data, options) {
    // tweetを選抜する 評価の指標
    // ☑id_str: 重複していないか？同じtweetを別の場所に掲載することは避けたい
    // ☑id_str: BANリストと照合する
    // ☑user.screen_name: BANリストと照合する
    // ☑possibly_sensitive: false
    // ☑filter_level: none,low,medium
    // ☑extended_tweet.full_text: 「ざつ旅」あり→最優先
    // ☑extended_tweet.full_text: 「場所名」あり→優先高
    // ☑favorite_count: 7
    // quote_count: 0
    // reply_count: 0
    // retweet_count: 0
    // source: SWARM、Foursquareの評価は？
    // retweetではない。オリジナルのtweetであること？

    data.forEach((item) => {
      const tid = u.safeRetrieve(item, 'id_str', '');
      const text = u.safeRetrieve(item, 'text', '');
      const possibly_sensitive = u.safeRetrieve(item, 'possibly_sensitive', false);
      const filter_level = u.safeRetrieve(item, 'filter_level', '');
      const favorite_count = u.safeRetrieve(item, 'favorite_count', 0);
      const screen_name = u.deepRetrieve(item, 'user.screen_name', '');
      const full_text = u.deepRetrieve(item, 'extended_tweet.full_text', '');
      item.x_score = 0;
      if (
        this.banned_tweet_id.has(tid) ||
        this.banned_user_screen_name.has(screen_name) ||
        this.deduped_tweets.has(tid) ||
        possibly_sensitive
      ) {
        item.x_score = -1;
        return undefined;
      }
      item.x_score += u.scoreViaText(`${text}${full_text}`, this.keyword, 10000);
      item.x_score += u.scoreViaText(`${text}${full_text}`, options.additional_keyword, 1000);
      item.x_score += u.scoreViaText(filter_level, 'medium', 100);
      item.x_score += u.scoreViaText(filter_level, 'low', 10);
      item.x_score += favorite_count;
      return undefined;
    });

    data.sort((a, b) => {
      if (b.x_score === a.x_score) {
        return new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf();
      }
      return b.x_score - a.x_score;
    });
    const best = data.shift();
    this.deduped_tweets.add(best.id_str);
    console.debug('...Tweet', options.additional_keyword, best.text);
    if (best.x_score < 0) {
      console.log(
        '###BADSCORE###',
        data.slice(0, 9).map((t) => `@${t.x_score}@${t.text}`),
        best
      );
      return undefined;
    }
    return best;
  }
}

module.exports = {
  TwitterApi,
};
