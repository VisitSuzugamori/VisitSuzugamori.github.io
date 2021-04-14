'use strict';

const fs = require('fs').promises;
const path = require('path');
const { DOMParser } = require('xmldom');
const { TwitterApi } = require('./twitter.js');
const { FlickrApi } = require('./flickr.js');
const { AginfoApi } = require('./aginfo.js');
const u = require('./common.js');

// eslint-disable-next-line node/no-unpublished-require
const secret = require('../my_secret.json');

const VistSuzugamori = require('../docs/VisitSuzugamori.json');
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

const flickr = new FlickrApi({
  flickr_key: secret.flickr.flickr_key,
});

const revGeoCoder = new AginfoApi();

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
  await u.makeDir(dirname);
  await fs.writeFile(path.normalize(`${dirname}/${journey}.tsv`), content);
}

async function writeHtml(journey) {
  const dirname = `docs/TJ${journey}`;
  await u.makeDir(dirname);
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
    .replace(/###subtitle###/gm, j.subtitle ? j.subtitle : '(単行本未収録)');
  const part2_source = cft[2];
  let part2 = '';
  const getAlignments = getAlignmentsGenerator();
  for (const point of s) {
    const coordinates = point.get('coordinates').split(',', 2);
    const tweet_id = await tw.getTweetIdByGeo({
      latlon: coordinates,
      additional_keyword: point.get('name'),
      search_type: 'search_recent',
    });
    const tweetContainer = getTweetContainerHtml(tweet_id);
    const flickrContent = tweet_id ? '' : await getFlickrContentHtml(coordinates);
    console.debug('building...', coordinates, tweet_id);
    const xbook = point.get('book') ? `${point.get('book')}巻` : '';
    const xpage = point.get('page') ? `P${point.get('page')}` : '';
    let address = '';
    try {
      address = await revGeoCoder.getAdress(coordinates);
      console.log(`...AginfoApi: ${address}`);
    } catch (e) {
      console.debug(e);
    }
    let part2_item = `${part2_source}\n`;
    part2 += part2_item
      .replace(/###align###/g, getAlignments())
      .replace(/###journey###/g, u.replaceCharactorEntity4Html(journey))
      .replace(/###book###/g, u.replaceCharactorEntity4Html(xbook))
      .replace(/###page###/g, u.replaceCharactorEntity4Html(xpage))
      .replace(/###name###/g, u.replaceCharactorEntity4Html(point.get('name')))
      .replace(/###special###/g, u.replaceCharactorEntity4Html(point.get('special')))
      .replace(/###tweet_id###/g, tweet_id ? u.replaceCharactorEntity4Html(tweet_id) : '')
      .replace(/###twitter###/g, tweetContainer)
      .replace(/###flickr###/g, flickrContent)
      .replace(/###address###/g, u.replaceCharactorEntity4Html(address))
      .replace(/###coordinates###/g, coordinates.join(', '));
  }

  const places = revGeoCoder.summarizePlaces();
  console.debug(journey, places);
  const content = part1.replace(/###place###/m, places.join(' ')) + part2 + cft[3];
  const dirname = `docs/TJ${journey}`;
  await u.makeDir(dirname);
  await fs.writeFile(path.normalize(`${dirname}/config.js`), content);
}

function getAlignmentsGenerator() {
  let index = 0;
  return () => {
    index++;
    if (index === 1) {
      return 'center';
    }
    return new Map([
      [0, 'right'],
      [1, 'left'],
    ]).get(index % 2);
  };
}

function getTweetContainerHtml(tweet_id) {
  if (typeof tweet_id === 'string') {
    return `<div class="tweetContainer" id="tweet${u.replaceCharactorEntity4Html(tweet_id)}"></div>`;
  }
  return '';
}

async function getFlickrContentHtml(latlon) {
  const image = await flickr.flickrImage(latlon).catch(console.log);
  if (image) {
    console.debug(`...Flickr ${image.title}`);
    const searchUrl = u.replaceCharactorEntity4Html(flickr.getSearchUrl(latlon));
    return `<p>
<img alt="${u.replaceCharactorEntity4Html(image.title)}" src="${u.replaceCharactorEntity4Html(image.url)}">
</p><p>photo from <a rel="noopener" href="${searchUrl}">Flickr</a>
【${u.replaceCharactorEntity4Html(image.title)}】
 by ${u.replaceCharactorEntity4Html(image.ownername)}</p>`.replace(/\n/g, '');
  }
  return '';
}

(async () => {
  const blocklist = await u.loadBlockList('./src/blocklist.txt');
  tw.setBlockList(blocklist);
  flickr.setBlockList(blocklist);
  try {
    const rawContent = await u.read_local_file(kmlPath);
    const parser = new DOMParser();
    const kml = parser.parseFromString(rawContent, 'application/xml');
    const placemarks = parseKml(kml);
    const byStory = indexByStory(placemarks);

    for (const sIndex of Array.from(byStory.keys()).filter((x) => x !== 'special')) {
      let jData = {};
      if (u.hasProperty(VistSuzugamori.stories, `TJ${sIndex}`)) {
        jData = VistSuzugamori.stories[`TJ${sIndex}`];
      }
      const sData = byStory.get(sIndex);
      await writeHtml(sIndex);
      await writeConfig(sIndex, sData, jData);
      await writeCsv(sIndex, sData);
      await u.simple_wait_sec(1);
    }
    await writeCsv('others', byStory.get('special'));
    console.debug(revGeoCoder.getAllPlaces());
  } catch (e) {
    console.log('VisitSuzugamori', e);
  }
})();
