const got = require('got');
const querystring = require('querystring');
const u = require('./common.js');

class FlickrApi {
  constructor(config) {
    this.flickr_key = config.flickr_key || '';
    this.radius = config.radius || 0.25;
    this.image_url = config.image_url || 'url_z';
    this.keyword = config.keyword || 'ざつ旅';
    this.banned_flickr_id =
      config.banned_flickr_id ||
      new Set([
        '0',
        '49541153372',
        '50757332573',
        '45397217974',
        '31045012166',
        '50818863053',
        '50184359292',
      ]);
    this.banned_owner_name = config.banned_owner_name || new Set(['IamEvilSpamerBecauseReject']);
    this.deduped = new Set();
  }

  getUrl(latlon) {
    if (!Array.isArray(latlon) || latlon.length < 2) {
      throw new Error('FlickrApi: invalid location');
    }
    return (
      'https://www.flickr.com/services/rest/?' +
      querystring.stringify({
        method: 'flickr.photos.search',
        api_key: this.flickr_key,
        privacy_filter: 1,
        content_type: 1,
        media: 'photos',
        lat: latlon[1],
        lon: latlon[0],
        radius: this.radius,
        format: 'json',
        nojsoncallback: 1,
        per_page: 10,
        extras: `license,owner_name,description,date_taken,${this.image_url}`,
      })
    );
  }

  getSearchUrl(latlon) {
    if (!Array.isArray(latlon) || latlon.length < 2) {
      throw new Error('FlickrApi: invalid location');
    }
    return (
      'https://www.flickr.com/search/?' +
      querystring.stringify({
        lat: latlon[1],
        lon: latlon[0],
        radius: this.radius,
        has_geo: 1,
        view_all: 1,
      })
    );
  }

  async flickrImage(latlon) {
    const res = await got(this.getUrl(latlon), { responseType: 'json' }).catch((e) => {
      throw e;
    });
    const data = await res.body;
    if (data.photos.total > 0) {
      const image = this.findSpecificImage(data.photos.photo);
      if (image) {
        // https://www.flickr.com/services/api/misc.urls.html
        image.url = image[this.image_url];
        return image;
      }
    }
    return undefined;
  }

  findSpecificImage(data) {
    // imageを選抜する 評価の指標
    // ☑id: 重複していないか？同じimageを別の場所に掲載することは避けたい
    // ☑id: BANリストと照合する
    // ☑ownername: BANリストと照合する
    // ☑title, description: 「ざつ旅」あり→優先
    // license: https://www.flickr.com/services/api/flickr.photos.licenses.getInfo.html

    data.forEach((item) => {
      const fid = u.safeRetrieve(item, 'id', '');
      const ownername = u.safeRetrieve(item, 'ownername', '');
      const title = u.safeRetrieve(item, 'title', '');
      const description = u.deepRetrieve(item, 'description._content)', '');
      if (this.banned_flickr_id.has(fid) || this.banned_owner_name.has(ownername) || this.deduped.has(fid)) {
        item.x_score = -1;
      } else {
        item.x_score = u.scoreViaText(`${title}${description}`, this.keyword, 1);
      }
    });

    data.sort((a, b) => {
      if (b.x_score === a.x_score) {
        return new Date(b.datetaken).valueOf() - new Date(a.datetaken).valueOf();
      }
      return b.x_score - a.x_score;
    });
    const best = data.shift();
    this.deduped.add(best.id);
    if (best.x_score < 0) {
      return undefined;
    }
    return best;
  }
}

module.exports = {
  FlickrApi,
};
