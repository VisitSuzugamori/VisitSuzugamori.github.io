const got = require('got');

class TwitterApi {
  constructor(config) {
    this.token = config.BEARER_TOKEN;
    const { keyword, query_param, radius, api_version, product_track, search_type, dry_run } = config;
    this.keyword = keyword;
    this.query_param = query_param;
    this.radius = radius;
    this.api_version = api_version;
    this.product_track = product_track;
    this.search_type = search_type;
    this.dry_run = dry_run;
    this.endpoint = new Map([
      [
        1.1,
        new Map([
          [
            'Standard',
            new Map([
              ['search_recent', '1.1/search/tweets.json'],
              ['search_full', ''],
            ]),
          ],
          [
            'Premium_Sandbox',
            new Map([
              ['search_recent', '1.1/search/tweets.json'],
              ['search_full_dev', '1.1/tweets/search/fullarchive/dev.json'], // development_environment: dev
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

  async searchRecentGeo(latlon = [137, 39]) {
    const api = this.getClient();
    const endpoint = this.getEndpoint(this.api_version, this.product_track, this.search_type);
    const params = this.setupParams(latlon);
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

  getEndpoint(version, product_track, search_type) {
    return this.endpoint.get(version).get(product_track).get(search_type);
  }

  setupParams(latlon) {
    const V2 = {
      query: `${this.keyword} ${this.query_param} point_radius:[${latlon[0]} ${latlon[1]} ${this.radius}]`,
      'place.fields': 'contained_within,full_name,geo,id,name,place_type',
      'media.fields': 'height,media_key,preview_image_url,type,url,width',
      'user.fields': 'created_at,id,name,profile_image_url,protected,username,verified',
      'tweet.fields': 'attachments,author_id,created_at,geo,id,lang,possibly_sensitive,text',
    };
    const V1_Premium = {
      query: `${this.keyword} ${this.query_param} point_radius:[${latlon[0]} ${latlon[1]} ${this.radius}]`,
      maxResults: 100,
      fromDate: '201502170000',
    };
    const V1_Standard = {
      q: `${this.keyword} filter:media`,
      geocode: `${latlon[1]},${latlon[0]},${this.radius}`,
      lang: 'ja',
      include_entities: 'false',
      count: 100,
    };
    return new Map([
      ['1.1_Standard', V1_Standard],
      ['1.1_Premium_Sandbox', V1_Premium],
      ['2_Standard', V2],
      ['2_Premium_Sandbox', V2],
    ]).get(`${this.api_version}_${this.product_track}`);
  }
}

module.exports = {
  TwitterApi,
};
