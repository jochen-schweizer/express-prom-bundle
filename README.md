[![build status](https://travis-ci.org/jochen-schweizer/express-prom-bundle.png)](https://travis-ci.org/jochen-schweizer/express-prom-bundle) [![Coverage Status](https://coveralls.io/repos/github/jochen-schweizer/express-prom-bundle/badge.svg?branch=master)](https://coveralls.io/github/jochen-schweizer/express-prom-bundle?branch=master) [![license](https://img.shields.io/github/license/mashape/apistatus.svg?maxAge=2592000)](https://www.tldrlegal.com/l/mit) [![NPM version](https://badge.fury.io/js/express-prom-bundle.png)](http://badge.fury.io/js/express-prom-bundle)

# express prometheus bundle

express middleware with popular prometheus metrics in one bundle.

Internally it uses **prom-client**. See: https://github.com/siimon/prom-client

Included metrics:

* `up`: normally is just 1
* `nodejs_memory_heap_total_bytes` and `nodejs_memory_heap_used_bytes`
* `http_request_seconds`: http latency histogram labeled with `status_code`

## Install

```
npm install express-prom-bundle
```

## Usage

```javascript
const promBundle = require("express-prom-bundle"),
      metricsMiddleware = promBundle({/* options */ });

app.use(metricsMiddleware);
app.use(/* your middleware */);
app.listen(3000);
```

**Usage Koa Framework (currently only v1)**

```javascript
const promBundle = require("express-prom-bundle"),
      c2k = require("koa-connect"),
      metricsMiddleware = promBundle({/* options */ });

app.use(c2k(metricsMiddleware));
app.use(/* your middleware */);
app.listen(3000);
```

* call your endpoints
* see your metrics here: [http://localhost:3000/metrics](http://localhost:3000/metrics)

**ALERT!**

The order in wich the routes are registered is important, since
**only the routes registered after the express-prom-bundle will be measured**

You can use this to your advantage to bypass some of the routes.
See the example below.

## Options

 * **prefix**:  prefix added to every metric name
 * **whitelist**, **blacklist**: array of strings or regexp specifying which metrics to include/exclude
 * **buckets**: buckets used for `http_request_seconds` histogram
 * **excludeRoutes**: array of strings or regexp specifying which routes should be skipped for `http_request_seconds` metric. It uses `req.path` as subject when checking
 * **autoregister**: boolean. If `/metrics` endpoint should be registered. It is **true** by default

## Example

setup std. metrics but exclude `up`-metric:

```javascript
"use strict";

const express = require("express"),
      app = express(),
      promBundle = require("express-prom-bundle");


// calls to this route will not appear in metrics
// because it's applied before promBundle
app.get("/status", (req, res) => res.send("i am healthy"));

app.use(promBundle({
    prefix: "demo_app:something",
    excludeRoutes: ["/foo"]
}));

// this call will NOT appear in metrics, because it matches excludeRoutes
app.get("/foo", (req, res) => res.send("bar"));

// calls to this route will appear in metrics
app.get("/hello", (req, res) => res.send("ok"));

app.listen(3000);
```

See an [advanced example on github](https://github.com/jochen-schweizer/express-prom-bundle/blob/master/advanced-example.js)

## License

MIT
