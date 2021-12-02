const fs = require('fs');
const https = require('https');
const connect = require('connect');
const logger = require('morgan');
const serveStatic = require('serve-static');

const options = {
  cert: fs.readFileSync('./cert/server.crt'),
  key: fs.readFileSync('./cert/server.key'),
};

const app = connect().use(logger('dev')).use(serveStatic('./docs/'));

https.createServer(options, app).listen(3000);
console.log('start serv');
