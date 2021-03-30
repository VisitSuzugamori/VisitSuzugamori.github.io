const got = require('got');

class FlickrApi {
  constructor(config) {
    this.flickr_key = config.flickr_key || '';
    this.radius = config.radius || 0.25;
  }

  getUrl(latlon) {
    if (!Array.isArray(latlon) || latlon.length < 2) {
      throw new Error('FlickrApi: invalid location');
    }
    return `https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=${this.flickr_key}&privacy_filter=1&content_type=1&media=photos&lat=${latlon[1]}&lon=${latlon[0]}&radius=0.1&format=json&nojsoncallback=1&per_page=5&extras=license,owner_name`;
  }

  async flickrImage(latlon) {
    const res = await got(this.getUrl(latlon), { responseType: 'json' }).catch((e) => {
      throw e;
    });
    const data = await res.body;
    // console.log(data);
    if (data.photos.total > 0) {
      const { server, id, secret, ownername, title, license } = data.photos.photo[0]; // description
      const url = `https://live.staticflickr.com/${server}/${id}_${secret}_z.jpg`;
      return { url, ownername, title, license };
    }
    return undefined;
  }

  async getContentHtml(latlon) {
    const image = await this.flickrImage(latlon).catch(console.log);
    if (image) {
      const searchUrl = `https://www.flickr.com/search/?lat=${latlon[1]}&lon=${latlon[0]}&radius=${this.radius}&has_geo=1&view_all=1`;
      return `<p><img src="${image.url}"></p><p>photo from <a rel="noopener" href="${searchUrl}">Flickr</a>【${image.title}】 by ${image.ownername}</p>`;
    }
    return '';
  }
}

module.exports = {
  FlickrApi,
};
