'use strict';

const express = require('express');
const app = express();
const promBundle = require('express-prom-bundle');

// here we want to remove default metrics provided in prom-client
// this must be done before initializing promBundle
clearInterval(promBundle.promClient.defaultMetrics());
promBundle.promClient.register.clear();

const bundle = promBundle({
  blacklist: [/up/],
  buckets: [0.1, 0.4, 0.7],
  includeMethod: true,
  includePath: true
});

app.use(bundle);

// native prom-client metric (no prefix)
const c1 = new bundle.promClient.Counter('c1', 'c1 help');
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
  'listening on 3000\n'
  + 'test in shell console\n\n'
  + 'curl localhost:3000/foo/1234\n'
  + 'curl -X DELETE localhost:3000/foo/5432\n'
  + 'curl localhost:3000/bar\n'
  + 'curl localhost:3000/metrics\n'
));
