'use strict';

const { TwitterApi } = require('./twitter.js');

(async () => {
  try {
    const tw = new TwitterApi({});
    const res = await tw.searchRecentGeo([139.41377258216218, 35.69919805437275]);
    console.log('OK', typeof res, res);
  } catch (e) {
    console.log('try E', e);
  }
})();
// +point_radius:[35.69919805437275+139.41377258216218+0.1km]
// 
