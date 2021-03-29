var layerTypes = {
  fill: ['fill-opacity'],
  line: ['line-opacity'],
  circle: ['circle-opacity', 'circle-stroke-opacity'],
  symbol: ['icon-opacity', 'text-opacity'],
  raster: ['raster-opacity'],
  'fill-extrusion': ['fill-extrusion-opacity'],
  heatmap: ['heatmap-opacity'],
};

var alignments = {
  left: 'lefty',
  center: 'centered',
  right: 'righty',
  full: 'fully',
};

function getLayerPaintType(layer) {
  var layerType = map.getLayer(layer).type;
  return layerTypes[layerType];
}

function setLayerOpacity(layer) {
  var paintProps = getLayerPaintType(layer.layer);
  paintProps.forEach(function (prop) {
    var options = {};
    if (layer.duration) {
      var transitionProp = prop + '-transition';
      options = { duration: layer.duration };
      map.setPaintProperty(layer.layer, transitionProp, options);
    }
    map.setPaintProperty(layer.layer, prop, layer.opacity, options);
  });
}

var story = document.getElementById('story');
var features = document.createElement('div');
features.setAttribute('id', 'features');

var header = document.createElement('div');

if (config.title) {
  var titleText = document.createElement('h1');
  titleText.innerText = config.title;
  header.appendChild(titleText);
}

if (config.subtitle) {
  var subtitleText = document.createElement('h2');
  subtitleText.innerText = config.subtitle;
  header.appendChild(subtitleText);
}

if (config.byline) {
  var bylineText = document.createElement('p');
  bylineText.innerText = config.byline;
  header.appendChild(bylineText);
}

if (header.innerText.length > 0) {
  header.classList.add(config.theme);
  header.setAttribute('id', 'header');
  story.appendChild(header);
}

config.chapters.forEach((record, idx) => {
  var container = document.createElement('div');
  var chapter = document.createElement('div');

  if (record.title) {
    var title = document.createElement('h3');
    title.innerText = record.title;
    chapter.appendChild(title);
  }

  if (record.image) {
    var image = new Image();
    image.src = record.image;
    chapter.appendChild(image);
  }

  if (record.description) {
    var story = document.createElement('div');
    story.innerHTML = record.description;
    chapter.appendChild(story);
  }

  container.setAttribute('id', record.id);
  container.classList.add('step');
  if (idx === 0) {
    container.classList.add('active');
  }

  chapter.classList.add(config.theme);
  container.appendChild(chapter);
  container.classList.add(alignments[record.alignment] || 'centered');
  if (record.hidden) {
    container.classList.add('hidden');
  }
  features.appendChild(container);
});

story.appendChild(features);

var footer = document.createElement('div');

if (config.footer) {
  var footerText = document.createElement('p');
  footerText.innerHTML = config.footer;
  footer.appendChild(footerText);
}

if (footer.innerText.length > 0) {
  footer.classList.add(config.theme);
  footer.setAttribute('id', 'footer');
  story.appendChild(footer);
}

mapboxgl.accessToken = config.accessToken;

const transformRequest = (url) => {
  const hasQuery = url.indexOf('?') !== -1;
  const suffix = hasQuery ? '&pluginName=scrollytellingV2' : '?pluginName=scrollytellingV2';
  return {
    url: url + suffix,
  };
};

const flickrImageUrl = async (record) => {
  const latlon = record.location.center;
  const flickr_key = 'f8c30ae7ac87e73ad0f516e314b5cfef';
  const url = `https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=${flickr_key}&privacy_filter=1&content_type=1&media=photos&lat=${latlon[1]}&lon=${latlon[0]}&radius=0.1&format=json&nojsoncallback=1&per_page=5&extras=license,owner_name`; // &text=${encodeURIComponent(record.name)}
  try {
    const res = await fetch(url).catch((e) => {
      console.log(e);
      throw e;
    });
    const data = await res.json();
    // console.log(data);
    if (data.photos.total > 0) {
      const { server, id, secret, ownername, description, title, license } = data.photos.photo[0];
      const url = `https://live.staticflickr.com/${server}/${id}_${secret}_z.jpg`;
      return { url, ownername, title, license };
    }
    return '';
  } catch (e) {
    console.log(e);
    throw e;
  }
};

const reverseGeocodeContent = async (latlon) => {
  try {
    const geocorder = mapboxClient.geocoding;
    const response = await geocorder
      .reverseGeocode({
        query: latlon,
        countries: ['JP'],
      })
      .send();
    if (response && response.body && response.body.features && response.body.features.length) {
      return response.body.features[0].place_name;
    }
    return '';
  } catch (e) {
    console.log(e);
    throw e;
  }
};

var map = new mapboxgl.Map({
  container: 'map',
  style: config.style,
  center: config.chapters[0].location.center,
  zoom: config.chapters[0].location.zoom,
  bearing: config.chapters[0].location.bearing,
  pitch: config.chapters[0].location.pitch,
  interactive: false,
  transformRequest: transformRequest,
});
const mapboxClient = mapboxSdk({ accessToken: config.accessToken });
const directions = new MapboxDirections({
  accessToken: config.accessToken,
  unit: 'metric',
  profile: 'mapbox/walking',
  interactive: false,
  controls: {
    inputs: false,
    instructions: false,
  },
  language: 'ja',
  flyTo: false,
});

map.on('load', () => {
  const chapters_length = config.chapters.length;
  config.chapters.forEach((record, idx) => {
    if (idx === 0) {
      directions.setOrigin(record.location.center);
    } else if (idx === chapters_length - 1) {
      directions.setDestination(record.location.center);
    } else {
      directions.setWaypoint(idx, record.location.center);
    }

    (async () => {
      const parent = document.getElementById(record.id);
      const place = await reverseGeocodeContent(record.location.center);
      if (place) {
        const content = document.createElement('p');
        content.innerText = place;
        parent.firstChild.appendChild(content);
      }

      if (Object.prototype.hasOwnProperty.call(record, 'tweet_id') && record.tweet_id) {
        const tid = record.tweet_id;
        await twttr.widgets.createTweet(tid, document.getElementById(`tweet${tid}`), {
          conversation: 'none',
          lang: 'ja',
        });
      } else {
        const image = await flickrImageUrl(record).catch(console.log);
        if (image) {
          const searchUrl = `https://www.flickr.com/search/?lat=${record.location.center[1]}&lon=${record.location.center[0]}&radius=0.25&has_geo=1&view_all=1`;
          const img = document.createElement('img');
          img.src = image.url;
          parent.firstChild.appendChild(img);
          const caption = document.createElement('p');
          caption.innerHTML = `photo from <a rel="noopener" href="${searchUrl}">Flickr</a>【${image.title}】 by ${image.ownername}`;
          parent.firstChild.appendChild(caption);
        }
      }
    })();
  });
});
map.addControl(directions);

if (config.showMarkers) {
  var marker = new mapboxgl.Marker({ color: config.markerColor });
  marker.setLngLat(config.chapters[0].location.center).addTo(map);
}

// instantiate the scrollama
var scroller = scrollama();

map.on('load', function () {
  if (config.use3dTerrain) {
    map.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512,
      maxzoom: 14,
    });
    // add the DEM source as a terrain layer with exaggerated height
    map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

    // add a sky layer that will show when the map is highly pitched
    map.addLayer({
      id: 'sky',
      type: 'sky',
      paint: {
        'sky-type': 'atmosphere',
        'sky-atmosphere-sun': [0.0, 0.0],
        'sky-atmosphere-sun-intensity': 15,
      },
    });
  }

  // setup the instance, pass callback functions
  scroller
    .setup({
      step: '.step',
      offset: 0.5,
      progress: true,
    })
    .onStepEnter((response) => {
      var chapter = config.chapters.find((chap) => chap.id === response.element.id);
      response.element.classList.add('active');
      map[chapter.mapAnimation || 'flyTo'](chapter.location);
      if (config.showMarkers) {
        marker.setLngLat(chapter.location.center);
      }
      if (chapter.onChapterEnter.length > 0) {
        chapter.onChapterEnter.forEach(setLayerOpacity);
      }
      if (chapter.callback) {
        window[chapter.callback].call(null, chapter);
      }
      if (chapter.rotateAnimation) {
        map.once('moveend', function () {
          const rotateNumber = map.getBearing();
          map.rotateTo(rotateNumber + 90, {
            duration: 24000,
            easing: function (t) {
              return t;
            },
          });
        });
      }
    })
    .onStepExit((response) => {
      var chapter = config.chapters.find((chap) => chap.id === response.element.id);
      response.element.classList.remove('active');
      if (chapter.onChapterExit.length > 0) {
        chapter.onChapterExit.forEach(setLayerOpacity);
      }
    });
});

// setup resize event
window.addEventListener('resize', scroller.resize);
