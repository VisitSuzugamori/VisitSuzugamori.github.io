const got = require('got');
const u = require('./common.js');

class AginfoApi {
  constructor() {
    // ref. https://aginfo.cgk.affrc.go.jp/rgeocode/index.html.ja
    this.endpoint = 'https://aginfo.cgk.affrc.go.jp/ws/rgeocode.php';
    this.default_params = {
      json: 1,
      ar: 100,
      ax: 1,
    };
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
    console.log(data.result.aza);

    if (this.isOK(data.status)) {
      const address = this.formatAdress(data.result);
      console.log(`###GET ${address}`);
      return address;
    }
    return undefined;
  }

  formatAdress(x) {
    const pref_name = u.deepRetrieve(x, 'prefecture.pname', '');
    const muni_name = u.deepRetrieve(x, 'municipality.mname', '');
    const aza_name = u.deepRetrieve(x, 'aza.0.name', '');
    const local_sec = u.deepRetrieve(x, 'local.section', '');
    const local_num = u.deepRetrieve(x, 'local.homenumber', '');
    return `${pref_name}${muni_name} ${aza_name}${local_sec}${local_num}`;
  }
}

module.exports = {
  AginfoApi,
};
