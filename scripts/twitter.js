const got = require('got');

class TwitterApi {
  constructor(config) {
    this.token = config.bearer_token;
    const { keyword, query_param, radius, api_version, product_track, search_type, dry_run } = config;
    this.keyword = keyword;
    this.query_param = query_param;
    this.radius = radius;
    this.api_version = api_version;
    this.product_track = product_track;
    this.search_type = search_type;
    this.dry_run = dry_run;
    this.deduped_tweets = new Set();
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
  }

  getClient() {
    return got.extend({
      responseType: 'json',
      prefixUrl: 'https://api.twitter.com/',
      headers: {
        'User-Agent': 'isnot/VistSuzugamori/searchTweets',
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
    console.log('getSearchRateLimitStatus', endpoint);
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
    return undefined;
  }

  async getTweetIdByGeo(options = {}) {
    try {
      const res = await this.searchGeo(options);
      const data = options.search_type === 'search_full_dev' ? res.results : res.statuses;
      while (data.length > 0) {
        const tweet = data.shift();
        if (!this.deduped_tweets.has(tweet.id_str)) {
          this.deduped_tweets.add(tweet.id_str);
          return tweet.id_str;
        }
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
    const res = await api(endpoint, { searchParams: params }).catch((e) => {
      throw e;
    });
    return res.body;
  }

  setupParams(latlon, additional_keyword, search_type) {
    // console.debug('setupParams', latlon, additional_keyword, search_type);
    const V2 = {
      query: `${this.keyword} OR ${additional_keyword} ${this.query_param} point_radius:[${latlon[0]} ${latlon[1]} ${this.radius}]`,
      'place.fields': 'contained_within,full_name,geo,id,name,place_type',
      'media.fields': 'height,media_key,preview_image_url,type,url,width',
      'user.fields': 'created_at,id,name,profile_image_url,protected,username,verified',
      'tweet.fields': 'attachments,author_id,created_at,geo,id,lang,possibly_sensitive,text',
    };
    const V1_Premium = {
      query: `${this.keyword} OR ${additional_keyword} ${this.query_param} point_radius:[${latlon[0]} ${latlon[1]} ${this.radius}]`,
      maxResults: 3,
      fromDate: '201502170000',
    };
    const V1_Standard = {
      q: `${this.keyword} OR ${additional_keyword} filter:media`,
      geocode: `${latlon[1]},${latlon[0]},${this.radius}`,
      lang: 'ja',
      include_entities: 'false',
      count: 3,
    };
    return new Map([
      ['1.1_search_recent', V1_Standard],
      ['1.1_search_full_dev', V1_Premium],
      ['2_search_recent', V2],
      ['2_search_full', V2],
      ['2_search_full_dev', V2],
    ]).get(`${this.api_version}_${search_type}`);
  }
}

module.exports = {
  TwitterApi,
};
