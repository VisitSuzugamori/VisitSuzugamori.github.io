const got = require('got');

class TwitterApi {
  constructor(config) {
    this.config = { ...config };
    this.token = config.BEARER_TOKEN;
    this.keyword = '#ざつ旅';
    this.query_param = 'has:images lang:ja -is:retweet';
    this.radius = '0.1km';
  }

  getClient() {
    return got.extend({
      responseType: 'json',
      prefixUrl: 'https://api.twitter.com/2',
      headers: {
        'User-Agent': 'isnot/VistSuzugamori/v2Search',
        Authorization: `Bearer ${this.token}`,
      },
    });
  }

  async searchRecentGeo(latlon = [137, 39]) {
    const params = {
      query: `${this.keyword} ${this.query_param}`,
      'place.fields': 'contained_within,full_name,geo,id,name,place_type',
      'media.fields': 'height,media_key,preview_image_url,type,url,width',
      'user.fields': 'created_at,id,name,profile_image_url,protected,username,verified',
      'tweet.fields': 'attachments,author_id,created_at,geo,id,lang,possibly_sensitive,text',
    };
    console.debug(params);
    // from:twitterdev -is:retweet
    const api = this.getClient();
    const res = await api('tweets/search/recent', { searchParams: params }).catch((e) => {
      // console.debug('E api call');
      throw e;
    });
    return res.body;
  }
}

module.exports = {
  TwitterApi,
};
