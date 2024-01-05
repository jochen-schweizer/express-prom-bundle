'use strict';

const express = require('express');
const app = express();
const promClient = require('prom-client');

// replace this with require('.') when running from library code
const promBundle = require('express-prom-bundle');

const bundle = promBundle({
  buckets: [0.1, 0.4, 0.7],
  includeMethod: true,
  includePath: true,
  customLabels: {year: null},
  transformLabels: labels => Object.assign(labels, {year: new Date().getFullYear()}),
  metricsPath: '/prometheus',
  promClient: {
    collectDefaultMetrics: {
    }
  },
  urlValueParser: {
    minHexLength: 5,
    extraMasks: [
      "^[0-9]+\\.[0-9]+\\.[0-9]+$", // replace dot-separated dates with #val, (regex as string)
      /^[0-9]+\-[0-9]+\-[0-9]+$/ // replace dash-separated dates with #val (actual regex)
    ]
  },
  normalizePath: [
    ['^/foo', '/example'] // replace /foo with /example
  ]
});

app.use(bundle);

// native prom-client metric (no prefix)
const c1 = new promClient.Counter({name: 'c1', help: 'c1 help'});
c1.inc(10);

app.get('/foo/:id', (req, res) => {
  setTimeout(() => {
    res.send('foo response\n');
  }, 500);
});
app.delete('/foo/:id', (req, res) => {
  setTimeout(() => {
    res.send('foo deleted\n');
  }, 300);
});
app.get('/bar', (req, res) => res.send('bar response\n'));

app.listen(3000, () => console.info(  // eslint-disable-line
  `listening on 3000
test in shell console:

curl localhost:3000/foo/1234
curl localhost:3000/foo/09.08.2018
curl -X DELETE localhost:3000/foo/5432
curl localhost:3000/bar
curl localhost:3000/prometheus
`
));
