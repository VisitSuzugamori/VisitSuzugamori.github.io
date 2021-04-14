'use strict';

const { TwitterApi } = require('./twitter.js');
const { FlickrApi } = require('./flickr.js');
const { AginfoApi } = require('./aginfo.js');
const u = require('./common.js');
// eslint-disable-next-line node/no-unpublished-require
const secret = require('../my_secret.json');

// console.log(secret);
(async () => {
  try {
    const tw = new TwitterApi({
      bearer_token: secret.twitter_dev.bearer_token,
      keyword: 'ざつ旅',
      query_param: 'has:images lang:ja', // -is:retweet
      radius: '1km',
      api_version: 1.1,
      product_track: 'Premium_Sandbox',
      search_type: 'search_full_dev',
      dry_run: false,
    });

    // const res = await tw.searchGeo({
    const res = await tw.getTweetIdByGeo({
      latlon: [141.06267088910175, 38.36961351956921],
      additional_keyword: '松島',
      search_type: 'search_recent',
    });
    console.log('OK', typeof res, res);

    const status = await tw.getSearchRateLimitStatus();
    console.log('status', status);

    const flickr = new FlickrApi({
      flickr_key: secret.flickr.flickr_key,
    });
    const fi = await flickr.flickrImage([141.06267088910175, 38.36961351956921]);
    console.log('FlickrApi', fi);

    const revGeoCoder = new AginfoApi();
    // const address = ;
    // console.log('AginfoApi', await revGeoCoder.getAdress([141.0628948, 38.3689558]));
    // console.log('AginfoApi', await revGeoCoder.getAdress([139.7631443, 35.6365639]));
    // console.log('AginfoApi', await revGeoCoder.getAdress([132.3181276, 34.2973092]));
    // console.log('AginfoApi', await revGeoCoder.getAdress([132.3198262, 34.2959885]));

    // console.log(u.replaceCharactorEntity4Html("h_nissy's Photography"));
  } catch (e) {
    console.log('exception', e);
  }
})();

u.loadBlockList('./src/blocklist.txt').then((blocklist) => {
  console.log(typeof blocklist, blocklist);
  console.log('banned_flickr_id', Array.from(blocklist.get('banned_flickr_id')));
});

// curl "https://api.twitter.com/1.1/search/tweets.json?q=filter:media+-filter:retweets&geocode=35.69919805437275,139.41377258216218,0.1km" -H "Authorization: Bearer "
// curl "https://api.twitter.com/1.1/tweets/search/fullarchive/dev.json?query=has:images+lang:ja+point_radius:\[139.41377258216218+35.69919805437275+0.1km\]" -H "Authorization: Bearer "
// curl "https://api.twitter.com/2/tweets/search/recent?query=has:images+lang:ja+happy" -H "Authorization: Bearer "
// curl "https://api.twitter.com/2/tweets/search/all?query=has:images+lang:ja+point_radius:\[139.41377258216218+35.69919805437275+0.1km\]" -H "Authorization: Bearer "

// from:suzugamori2 geocode:35.69773091067881,139.58361482336417,1km
// geocode:38.36961351956921,141.06267088910175,10km
