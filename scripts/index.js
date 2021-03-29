'use strict';

const fs = require('fs').promises;
const path = require('path');
const { DOMParser } = require('xmldom');
const VistSuzugamori = require('../docs/VisitSuzugamori.json');
const { TwitterApi } = require('./twitter.js');
const secret = require('../my_secret.json');

const kmlPath = path.normalize('zatsumap.kml');
const configPath = path.normalize('src/config_js.template');
const replacements = { '': '', '（前編）': '-1', '（後編）': '-2' };

const tw = new TwitterApi({
  bearer_token: secret.twitter_dev.bearer_token,
  keyword: VistSuzugamori.series.short_title,
  query_param: 'has:images lang:ja', // -is:retweet
  radius: '1km',
  api_version: 1.1,
  product_track: 'Premium_Sandbox',
  search_type: 'search_full_dev',
  dry_run: false,
});

(async () => {
  try {
    const rawContent = await read_kml_file(kmlPath);
    const parser = new DOMParser();
    const kml = parser.parseFromString(rawContent, 'application/xml');
    const placemarks = parseKml(kml);
    const byStory = indexByStory(placemarks);

    for (const sIndex of Array.from(byStory.keys()).filter((x) => x !== 'special')) {
      let jData = {};
      if (Object.prototype.hasOwnProperty.call(VistSuzugamori.stories, `TJ${sIndex}`)) {
        jData = VistSuzugamori.stories[`TJ${sIndex}`];
      }
      const sData = byStory.get(sIndex);
      await writeHtml(sIndex);
      await writeConfig(sIndex, sData, jData);
      await writeCsv(sIndex, sData);
    }
    await writeCsv('others', byStory.get('special'));
  } catch (e) {
    console.log('VisitSuzugamori', e);
  }
})();

async function read_kml_file(filepath) {
  return fs.readFile(filepath, { encoding: 'utf-8', flag: 'r' });
}

function parseKml(kml) {
  const data = new Set();
  const points = kml.documentElement.getElementsByTagName('Placemark');

  for (const item of Array.from(points)) {
    const poi = new Map();
    poi.set('name', item.getElementsByTagName('name')[0].textContent.trim());
    poi.set('description', item.getElementsByTagName('description')[0].textContent.trim());
    const point = item.getElementsByTagName('Point')[0];
    poi.set('coordinates', point.getElementsByTagName('coordinates')[0].textContent.trim());
    data.add(poi);
  }
  return data;
}

function indexByStory(data) {
  const index = new Map();
  for (const poi of data) {
    const description = poi.get('description');
    const chunks1 = description.split('<br>');
    if (description.indexOf('＆') > -1) {
      chunks1.pop(); // dedup item
      description.split('＆').forEach((chunks2) => {
        chunks1.push(chunks2);
      });
    }
    for (const chunk of chunks1) {
      const point = new Map(poi);
      let special = chunk;
      let book = 0;
      let journey = 'special';
      let page = '';

      const match_j = chunk.match(/第(\d{1,3})旅(\S*)(?:\s|$)/);
      if (Array.isArray(match_j)) {
        journey = match_j[1] + replacements[`${match_j[2]}`];
        if (journey === '13') {
          journey = '13-1';
        }
        if (match_j[1].length === 1) {
          journey = `0${journey}`;
        }
        special = '';
      }

      const match_b = chunk.match(/(\d{1,3})巻/);
      if (Array.isArray(match_b)) {
        book = parseInt(match_b[1], 10);
      }

      const match_p = chunk.match(/(?:\d{1,3})巻P(\d{1,3},?\d{0,3})(?:\s|$)/);
      if (Array.isArray(match_p)) {
        page = match_p[1];
      }

      const jset = index.has(journey) ? index.get(journey) : new Set();
      point.set('special', special);
      point.set('book', book);
      point.set('journey', journey);
      point.set('page', page);
      jset.add(point);
      index.set(journey, jset);
    }
  }
  // console.debug(Array.from(index.get('special')).map(x => x.get('description')));
  return index;
}

async function makeDir(dirname) {
  try {
    await fs.stat(dirname);
    await fs.access(dirname);
  } catch (e) {
    await fs.mkdir(dirname, { mode: 0o755 });
    console.log(`mkdir: ${dirname}`);
  }
}

async function writeCsv(journey, s) {
  let content = '';
  for (const item of s) {
    content +=
      [
        item.get('book'),
        item.get('journey'),
        item.get('page'),
        item.get('name'),
        item.get('coordinates'),
        item.get('description'),
      ].join('\t') + '\n';
  }
  const dirname = 'dist/csv';
  await makeDir(dirname);
  await fs.writeFile(path.normalize(`${dirname}/${journey}.tsv`), content);
}

async function writeHtml(journey) {
  const dirname = `docs/TJ${journey}`;
  await makeDir(dirname);
  const html_source = await fs.readFile('src/index.html', { encoding: 'utf-8', flag: 'r' });
  await fs.writeFile(path.normalize(`${dirname}/index.html`), html_source);
}

async function writeConfig(journey, s, j) {
  const template_source = await fs.readFile(configPath, { encoding: 'utf-8', flag: 'r' });
  const cft = template_source.match(/(.+)###chapter-start###(.+)###chapter-end###(.+)/ms);
  if (!Array.isArray(cft)) {
    return;
  }
  const part1 = cft[1]
    .replace(/###mapbox_access_token###/m, secret.mapbox.access_token)
    .replace(/###journey###/gm, journey)
    .replace(/###title###/gm, j.title)
    .replace(/###place###/gm, j.place)
    .replace(/###subtitle###/gm, j.subtitle);
  const part2_source = cft[2];
  let part2 = '';
  for (const point of s) {
    const coordinates = point.get('coordinates').split(',', 2);
    const twitter_id = await getTwitterId({
      latlon: coordinates,
      additional_keyword: point.get('name'),
      search_type: 'search_recent',
    });
    console.log('wC tw:', coordinates, twitter_id);
    const tweetContainer = twitter_id ? `<div class="tweetContainer" id="tweet${twitter_id}"></div>` : '';
    let part2_item = `${part2_source}\n`;
    part2 += part2_item
      .replace(/###journey###/g, journey)
      .replace(/###book###/g, `${point.get('book')}巻`)
      .replace(/###page###/g, `P${point.get('page')}`)
      .replace(/###name###/g, point.get('name'))
      .replace(/###special###/g, point.get('special'))
      .replace(/###twitter_id###/g, twitter_id)
      .replace(/###twitter###/g, tweetContainer)
      .replace(/###coordinates###/g, coordinates.join(', '));
  }
  const content = part1 + part2 + cft[3];
  const dirname = `docs/TJ${journey}`;
  await makeDir(dirname);
  await fs.writeFile(path.normalize(`${dirname}/config.js`), content);
}

async function getTwitterId({ latlon, additional_keyword, search_type }) {
  try {
    const res = await tw.searchGeo({
      latlon,
      additional_keyword,
      search_type,
    });
    // console.log('OK', typeof res, res);
    const data = search_type === 'search_full_dev' ? res.results : res.statuses;
    const tweet = data.filter((x) => !x.possibly_sensitive).shift();
    if (typeof tweet === 'object') {
      return tweet.id;
    }
    return undefined;
  } catch (e) {
    console.log('exception', e);
    return undefined;
  }
}
