const fs = require('fs').promises;

class Common {
  async makeDir(dirname) {
    try {
      await fs.stat(dirname);
      await fs.access(dirname);
    } catch (e) {
      await fs.mkdir(dirname, { mode: 0o755 });
      // console.debug(`mkdir: ${dirname}`);
    }
  }

  async read_local_file(filepath) {
    return fs.readFile(filepath, { encoding: 'utf-8', flag: 'r' });
  }

  async loadBlockList(filename = 'blocklist.txt') {
    const raw = await this.read_local_file(filename).catch((e) => {
      throw new Error(`cannot read blocklist. ${e}`);
    });
    const data = new Map();
    let subject = '';
    raw.split(/\n/).forEach((line) => {
      const head = line.substring(0, 1);
      if (head === '#' || line === '') {
        return undefined;
      }
      if (head === '@') {
        subject = line.substring(1);
        return undefined;
      }
      if (!data.has(subject)) {
        data.set(subject, new Set());
      }
      data.get(subject).add(line);
    });
    return data;
  }

  scoreViaText(text = '', keyword = '', point = 0) {
    return text.indexOf(keyword) > -1 ? point : 0;
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
    return text.replace(/[<>&"']/gm, (match) => {
      return ent[`${match}`];
    });
  }
}

module.exports = new Common();
