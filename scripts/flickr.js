const got = require('got');
const querystring = require('querystring');
const u = require('./common.js');

class FlickrApi {
  constructor(config) {
    this.flickr_key = config.flickr_key || '';
    this.radius = config.radius || 0.25;
    this.image_url = config.image_url || 'url_z';
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
        per_page: 5,
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
    // console.log(data);
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
      item.x_score = 0;
      if (this.banViaId(fid) || this.banViaOwnerName(ownername) || this.isRedundancy(fid)) {
        item.x_score = -1;
        return undefined;
      }
      item.x_score += this.scoreViaText(`${title}${description}`, 'ざつ旅', 10000);
      // item.x_score += favorite_count;
      return undefined;
    });

    data.sort((a, b) => {
      if (b.x_score === a.x_score) {
        return new Date(b.datetaken).valueOf() - new Date(a.datetaken).valueOf();
      }
      return b.x_score - a.x_score;
    });
    const best = data.shift();
    // console.debug('...Flickr', best, data);
    if (best.x_score < 0) {
      return undefined;
    }
    return best;
  }

  banViaOwnerName(ownername) {
    return new Set(['IamEvilSpamerBecauseReject']).has(ownername);
  }

  banViaId(fid) {
    return new Set([0]).has(fid);
  }

  isRedundancy(fid) {
    if (this.deduped.has(fid)) {
      return true;
    }
    this.deduped.add(fid);
    return false;
  }

  scoreViaText(text = '', keyword = '', point = 0) {
    return text.indexOf(keyword) > -1 ? point : 0;
  }
}

module.exports = {
  FlickrApi,
};
