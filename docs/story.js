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
  const ll = `${record.location.center[1]},${record.location.center[0]}`;

  if (record.id !== '') {
    var anchor = document.createElement('div');
    anchor.classList.add('anchor');
    anchor.innerHTML = `<a rel="noopener" href="#${encodeURIComponent(record.id)}" class="LinkToHere" title="この場所へのリンク">⚓</a>
<a rel="noopener" href="https://www.google.com/maps/@?api=1&map_action=map&amp;center=${ll}" class="LinkToGMap" title="${ll}">🌏</a>
<a rel="noopener" href="https://twitter.com/share?ref_src=twsrc%5Etfw" class="twitter-share-button"
 data-text="いまココ ${record.title.replace(/[<>"'&]/g, '')}"
 data-url="${document.location.href}#${encodeURIComponent(record.id)}"
 data-hashtags="ざつ旅,VisitSuzugamori"
 data-lang="ja" data-show-count="false">Tweet</a>`;
    chapter.appendChild(anchor);
  }

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
    story.classList.add('placeDescription');
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

document.getElementsByTagName('title')[0].innerText = `${config.title} | ${config.byline}`;
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

async function scrollToAndRedrow(el) {
  el.scrollIntoView();
  window.scrollByLines(2);
  scroller.resize();
  return undefined;
}

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
      if (document.location.hash === record.id) {
        scrollToAndRedrow(parent);
      }
      if (Object.prototype.hasOwnProperty.call(record, 'tweet_id') && record.tweet_id) {
        const tid = record.tweet_id;
        await twttr.widgets.createTweet(tid, document.getElementById(`tweet${tid}`), {
          conversation: 'none',
          lang: 'ja',
        });
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
