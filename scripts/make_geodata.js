'use strict';

const fs = require('fs').promises;
const { DOMParser } = require('xmldom');
const turf = require('@turf/turf');
const u = require('./common.js');
const kmlPath = './geodata/administrative_boundary.kml';

function uniquePlacesSet(VisitSuzugamori) {
  const area = new Set();
  Object.values(VisitSuzugamori.stories).forEach((val) => {
    val.place.split(' ').forEach((iplace) => {
      area.add(iplace);
    });
  });
  return area;
}

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

function screaningByPlace(data, area) {
  const index = new Map();
  for (const place of area) {
    if (data.has(place)) {
      index.set(place, data.get(place));
    }
  }
  return index;
}

function makeGeojson(data) {
  const multi_feature = [];
  data.forEach((value, place) => {
    const multi = [];
    for (const raw_a of value) {
      const line = [];
      for (const raw_s of raw_a) {
        line.push(raw_s.split(',').map(Number));
      }
      multi.push([line]);
    }

    // console.log(place, multi);
    multi_feature.push(featurePolygon(multi, place));
  });

  return turf.featureCollection(multi_feature, {
    id: 'ThatsJourney_VisitSuzugamori',
    // crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
  });
}

function featurePolygon(multi_coordinates, name) {
  return turf.multiPolygon(multi_coordinates, { name: name }, { id: name });
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
    const pdata = uniquePlacesSet(VisitSuzugamori);

    const rawContent = await u.read_local_file(kmlPath);
    const parser = new DOMParser();
    const kml = parser.parseFromString(rawContent, 'application/xml');
    const placemarks = parseKml(kml);
    const placeToPolygons = screaningByPlace(placemarks, pdata);
    const geojson = makeGeojson(placeToPolygons);

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
