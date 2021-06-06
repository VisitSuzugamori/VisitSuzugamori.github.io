const got = require('got');
const u = require('../common.js');

class AginfoApi {
  constructor() {
    // ref. https://aginfo.cgk.affrc.go.jp/rgeocode/index.html.ja
    this.endpoint = 'https://aginfo.cgk.affrc.go.jp/ws/rgeocode.php';
    this.default_params = {
      json: 1,
      lr: 500,
      lx: 1,
      ar: 500,
      ax: 1,
    };
    this.place = new Set();
    this.all_place = new Set();
  }

  getParams(lonlat) {
    if (!Array.isArray(lonlat) || lonlat.length < 2) {
      throw new Error('AginfoApi: invalid location');
    }
    return Object.assign(this.default_params, { lat: lonlat[1], lon: lonlat[0] });
  }

  isOK(code = 0) {
    if (!Number.isSafeInteger(code)) {
      throw new Error('AginfoApi: request failure.');
    }
    if (200 > code || code > 399) {
      console.log(`AginfoApi: request failure. code ${code}`);
      return false;
    }
    return true;
  }

  async getAdress(lonlat) {
    const res = await got(this.endpoint, {
      responseType: 'json',
      searchParams: this.getParams(lonlat),
    }).catch((e) => {
      throw e;
    });
    const data = await res.body;
    // console.debug(data);

    if (this.isOK(data.status)) {
      const address = this.parseResult(data.result);
      this.place.add(address.muni_name.replace(' ', ''));
      return this.formatAdress(address);
    }
    return '';
  }

  parseResult(x) {
    const pref_name = u.deepRetrieve(x, 'prefecture.pname', '');
    const muni_name = u.deepRetrieve(x, 'municipality.mname', '');
    const local = u.deepRetrieve(x, 'local', []);
    const local_sec = u.deepRetrieve(local[0], 'section', '');
    const local_num = u.deepRetrieve(local[0], 'homenumber', '');
    const aza = u.deepRetrieve(x, 'aza', []);
    const aza_name = u.deepRetrieve(aza[0], 'name', '');
    return {
      pref_name,
      muni_name,
      local_name: `${aza_name}${local_sec}${local_num}`,
    };
  }

  formatAdress(address = {}) {
    return `${address.pref_name}${address.muni_name} ${address.local_name}`;
  }

  summarizePlaces() {
    for (const item of this.place) {
      this.all_place.add(item);
    }
    const set = Array.from(this.place);
    this.place.clear();
    return set;
  }

  getAllPlaces() {
    return Array.from(this.all_place);
  }
}

module.exports = {
  AginfoApi,
};
