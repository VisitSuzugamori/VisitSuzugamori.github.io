'use strict';

const { TwitterApi } = require('./api/twitter.js');
const u = require('./common.js');
// eslint-disable-next-line node/no-unpublished-require
const secret = require('../my_secret.json');

(async () => {
  try {
    const tw = new TwitterApi({
      bearer_token: secret.twitter_dev.bearer_token,
      keyword: '',
      query_param: 'lang:ja',
      api_version: 1.1,
      product_track: 'Premium_Sandbox',
      search_type: 'search_full_dev',
      dry_run: false,
    });

    const res = await tw.getSearch({
      params: {
        q: 'from:isnot49662340', // suzugamori2
        // fromDate: '202105260000',
        // toDate: '202105262359',
      },
      search_type: 'search_recent',
    });
    console.log('OK', typeof res);

    const tweets = Array.isArray(res.results) ? res.results : Array.isArray(res.statuses) ? res.statuses : [];
    tweets.forEach((item) => {
      console.log(`${item.created_at}\t${item.id_str}\t${item.text}`, item.geo, item.place);
    });

    const status = await tw.getSearchRateLimitStatus();
    console.log('status', status);
  } catch (e) {
    console.log('exception', e);
  }
})();
