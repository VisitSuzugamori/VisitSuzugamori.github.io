'use strict';

const { TwitterApi } = require('./api/twitter.js');
// eslint-disable-next-line no-unused-vars
const u = require('./common.js');
// eslint-disable-next-line node/no-unpublished-require
const secret = require('../my_secret.json');

(async () => {
  try {
    const tw = new TwitterApi({
      bearer_token: secret.twitter_dev.bearer_token,
      keyword: '',
      query_param: 'lang:ja',
      api_version: 2,
      product_track: 'Premium_Sandbox',
      search_type: 'search_full_dev',
      dry_run: false,
    });


    // const res = await tw.getPollByTweetId('1464522037188128770').catch(console.log);
    const res = await tw.getPollByTweetId('1464891440945713153').catch(console.log);
    console.log(JSON.stringify(res, null, 2));

    // const res = await tw.getSearch({
    //   params: {
    //     q: 'from:suzugamori2 一度旅した県を改めて訪れて、また違う旅をしたいと思います。どの県へ再訪しよう', // suzugamori2 isnot49662340
    //     // fromDate: '202105260000',
    //     // toDate: '202105262359',
    //   },
    //   search_type: 'search_recent',
    // });
    // console.log('OK', typeof res);

    // const tweets = Array.isArray(res.results) ? res.results : Array.isArray(res.statuses) ? res.statuses : [];
    // tweets.forEach((item) => {
    //   console.log(`${item.created_at}\t${item.id_str}\t${item.text}`, item.geo, item.place);
    //   console.log(item);
    // });

    // const status = await tw.getSearchRateLimitStatus();
    // console.log('status', status);
  } catch (e) {
    console.log('exception', e);
  }
})();
