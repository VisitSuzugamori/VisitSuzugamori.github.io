const fs = require('fs').promises;

class Common {
  async makeDir(dirname) {
    try {
      await fs.stat(dirname);
      await fs.access(dirname);
    } catch (e) {
      await fs.mkdir(dirname, { mode: 0o755 });
      console.log(`mkdir: ${dirname}`);
    }
  }

  simple_wait_sec(sec = 1) {
    return new Promise((resolve) => setTimeout(resolve, sec * 1000));
  }

  safeRetrieve(target = {}, key = '', alternate = '') {
    if (typeof target !== 'object' || target === null) {
      return alternate;
    }
    try {
      const myMap = new Map(Object.entries(target));
      if (myMap.has(key)) {
        const value = myMap.get(key);
        myMap.clear();
        return typeof value === typeof alternate ? value : alternate;
      }
      myMap.clear();
      return alternate;
    } catch (e) {
      return alternate;
    }
  }

  deepRetrieve(target, pos, alternate = undefined) {
    let cur = target;
    if (typeof pos !== 'string' || typeof target !== 'object' || target === null) {
      return alternate;
    }
    try {
      const pos_keys = pos.split('.');
      const pos_len = pos_keys.length;
      pos_keys.forEach((el, idx) => {
        const wants = idx === pos_len - 1 ? alternate : {};
        cur = this.safeRetrieve(cur, el, wants);
      });
    } catch (e) {
      return alternate;
    }
    return cur;
  }

  hasProperty(obj, prop) {
    // const hasProperty = Object.prototype.hasOwnProperty;
    // return Object.prototype.hasOwnProperty.call(obj, prop);
    return new Map(Object.entries(obj)).has(prop);
  }

  replaceCharactorEntity4Html(text) {
    if (typeof text !== 'string' || !text) {
      return text;
    }
    const ent = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      '\'': '&#39;', // eslint-disable-line prettier/prettier
      // '*' : '&#42;',
      // '_' : '&#95;',
    };
    return text.replace(/[<>&]/g, (match) => {
      return ent[`${match}`];
    });
  }
}

module.exports = new Common();
