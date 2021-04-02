'use strict';

const data = require('../docs/VisitSuzugamori.json');

const journey = Object.keys(data.stories);
journey.forEach((tj) => {
  const p = data.stories[tj];
  console.log(`<li><a rel="noopener" href="/${p.id}/">${p.title} ${p.subtitle}</a></li>`);
});

Object.keys(data.books).forEach((n) => {
  console.log(`<img src="${data.books[n].cover_image_url}">`);
});

(async () => {
  try {
  } catch (e) {
    console.log('exception', e);
  }
})();
