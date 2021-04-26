'use strict';

const fs = require('fs').promises;
const { DOMParser } = require('xmldom');
const turf = require('@turf/turf');
const u = require('./common.js');
const kmlPath = './geodata/administrative_boundary.kml';

function parseKml(kml) {
  const poi = new Map();
  for (const item of Array.from(kml.documentElement.getElementsByTagName('Placemark'))) {
    const name = item.getElementsByTagName('name')[0].textContent.trim();
    const polygons = poi.has(name) ? poi.get(name) : [];
    polygons.push(item.getElementsByTagName('coordinates')[0].textContent.trim().split(' '));
    poi.set(name, polygons);
  }
  return poi;
}

function indexByStory(data, pdata) {
  const index = new Map();
  for (const p of pdata) {
    let area = [];
    for (const place of p[1].split(' ')) {
      const polygons = data.get(place);
      if (Array.isArray(polygons)) {
        area = area.concat(polygons);
      }
    }
    index.set(p[0], area);
  }
  return index;
}

function makeGeojson(mJourney) {
  const multi_feature = [];
  mJourney.forEach((value, journey) => {
    const multi = [];
    for (const raw_a of value) {
      const line = [];
      for (const raw_s of raw_a) {
        line.push(raw_s.split(',').map(Number));
      }
      multi.push([line]);
    }

    // console.log(journey, multi);
    multi_feature.push(featurePolygon(multi, journey));
  });

  return turf.featureCollection(multi_feature, {
    id: 'ThatsJourney_VisitSuzugamori',
    // crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
  });
}

function featurePolygon(multi_coordinates, journey) {
  return turf.multiPolygon(multi_coordinates, { name: journey }, { id: journey });
}

function dump_geojson_geometory(geojson) {
  try {
    const target = geojson.features[0].geometry.coordinates;
    if (
      !Array.isArray(target) ||
      !Array.isArray(target[0]) ||
      !Array.isArray(target[0][0]) ||
      !Array.isArray(target[0][0][0]) ||
      Array.isArray(target[0][0][0][0])
    ) {
      throw new Error('It is not geojson / Array.');
    }
    const dump_array_recursive = (a) => {
      for (const d of a) {
        if (!Array.isArray(d[0][0])) {
          return `${d.length}-`;
        }
        return dump_array_recursive(d);
      }
    };
    console.log(dump_array_recursive(geojson.features.map((x) => x.geometry.coordinates)));
  } catch (e) {
    console.warn('invalid input data.', e);
  }
}

(async () => {
  try {
    const VS = await u.read_local_file('./docs/VisitSuzugamori.json');
    const VisitSuzugamori = JSON.parse(VS);

    const rawContent = await u.read_local_file(kmlPath);
    const parser = new DOMParser();
    const kml = parser.parseFromString(rawContent, 'application/xml');
    const placemarks = parseKml(kml);

    const pdata = Object.keys(VisitSuzugamori.stories).map((journey) => [
      journey,
      VisitSuzugamori.stories[journey].place,
    ]);
    const byStory = indexByStory(placemarks, pdata);
    const geojson = makeGeojson(byStory);

    dump_geojson_geometory(geojson);

    await fs.writeFile('./geodata/administrative_boundary.geojson', JSON.stringify(geojson, null, 1));
  } catch (e) {
    console.log('VisitSuzugamori', e);
  }
})();

/*
<?xml version="1.0" encoding="utf-8" ?>
<kml xmlns="http://www.opengis.net/kml/2.2">
 <Document id="root_doc">
  <Folder>
   <name>LayerName</name>
   <Placemark>
    <name>札幌市中央区</name>
    <Style>
     <LineStyle><color>ff0000ff</color></LineStyle>
     <PolyStyle><fill>0</fill></PolyStyle>
    </Style>
     <MultiGeometry>
      <Polygon>
       <outerBoundaryIs>
        <LinearRing>
         <coordinates>141.25743139,42.99781611 141.25724472,42.99781028 </coordinates>
        </LinearRing>
       </outerBoundaryIs>
      </Polygon>
     </MultiGeometry>
   </Placemark>
*/
