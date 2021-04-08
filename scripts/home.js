'use strict';

const data = require('../docs/VisitSuzugamori.json');
const u = require('./common.js');

const journey = Object.keys(data.stories);
journey.forEach((tj) => {
  const p = data.stories[tj];
  console.log(
    `<li><a rel="noopener" href="/${u.replaceCharactorEntity4Html(p.id)}/">
           ${u.replaceCharactorEntity4Html(p.title)}
           ${u.replaceCharactorEntity4Html(p.subtitle)}</a></li>`
  );
});

Object.keys(data.books).forEach((n) => {
  console.log(`<img src="${u.replaceCharactorEntity4Html(data.books[n].cover_image_url)}">`);
});
