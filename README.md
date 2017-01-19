[![build status](https://travis-ci.org/jochen-schweizer/express-prom-bundle.png)](https://travis-ci.org/jochen-schweizer/express-prom-bundle) [![Coverage Status](https://coveralls.io/repos/github/jochen-schweizer/express-prom-bundle/badge.svg?branch=master)](https://coveralls.io/github/jochen-schweizer/express-prom-bundle?branch=master) [![license](https://img.shields.io/github/license/mashape/apistatus.svg?maxAge=2592000)](https://www.tldrlegal.com/l/mit) [![NPM version](https://badge.fury.io/js/express-prom-bundle.png)](http://badge.fury.io/js/express-prom-bundle)

# express prometheus bundle

Express middleware with popular prometheus metrics in one bundle. It's also compatible with koa v1 (see below).

Internally it uses **prom-client**. See: https://github.com/siimon/prom-client

Included metrics:

* `up`: normally is just 1
* `http_request_duration_seconds`: http latency histogram labeled with `status_code`, `method` and `path`

**Please note version 2.x is NOT backwards compatible with 1.x**

## Install

```
npm install express-prom-bundle
```

## Usage

```javascript
const promBundle = require("express-prom-bundle");
const metricsMiddleware = promBundle({/* options */ });
const app = require("express")();

app.use(metricsMiddleware);
app.use(/* your middleware */);
app.listen(3000);
```

* call your endpoints
* see your metrics here: [http://localhost:3000/metrics](http://localhost:3000/metrics)

**ALERT!**

The order in which the routes are registered is important, since
**only the routes registered after the express-prom-bundle will be measured**

You can use this to your advantage to bypass some of the routes.
See the example below.

## Options

* **buckets**: buckets used for `http_request_seconds` histogram
* **includeMethod**: include HTTP method (GET, PUT, ...) as a label to `http_request_duration_seconds`
* **includePath**: include URL path as a label (see below)
* **normalizePath**: boolean or `function(req)` - path normalization for `includePath` option
* **autoregister**: if `/metrics` endpoint should be registered. (Default: **true**)
* **whitelist**, **blacklist**: array of strings or regexp specifying which metrics to include/exclude
* **excludeRoutes**: (deprecated) array of strings or regexp specifying which routes should be skipped for `http_request_duration_seconds` metric. It uses `req.originalUrl` as subject when checking. You want normally use express or meddleware features instead of this options.
### More details on includePath option

The goal is to have separate latency statistics by URL path, e.g. `/my-app/user/`, `/products/by-category` etc.

Just taking `req.path` as a label value won't work as IDs are often part of the URL, like `/user/12352/profile`. So what we actually need is a path template. The module tries to figure out what parts of the path are values or IDs, and what is an actual path. The example mentioned before would be normalized to `/user/#val/profile` and that will become the value for the label.

You can override this magical behavior and define your own function by providing an optional callback using **normalizePath** option.

For more details:
 * [url-value-parser](https://www.npmjs.com/package/url-value-parser) - magic behind automatic path normalization
 * [normalizePath.js](https://github.com/jochen-schweizer/express-prom-bundle/blob/master/src/normalizePath.js) - source code for path processing, for you



## express example

setup std. metrics but exclude `up`-metric:

```javascript
const express = require("express");
const app = express();
const promBundle = require("express-prom-bundle");

// calls to this route will not appear in metrics
// because it's applied before promBundle
app.get("/status", (req, res) => res.send("i am healthy"));

// register metrics collection for all routes except those starting with /foo
app.use("/((?!foo))*", promBundle({includePath: true}));

// this call will NOT appear in metrics, because express will skip the metrics middleware
app.get("/foo", (req, res) => res.send("bar"));

// calls to this route will appear in metrics
app.get("/hello", (req, res) => res.send("ok"));

app.listen(3000);
```

See an [advanced example on github](https://github.com/jochen-schweizer/express-prom-bundle/blob/master/advanced-example.js)

## koa v1 example

```javascript
const promBundle = require("express-prom-bundle");
const koa = require("koa");
const c2k = require("koa-connect");
const metricsMiddleware = promBundle({/* options */ });

const app = koa();

app.use(c2k(metricsMiddleware));
app.use(/* your middleware */);
app.listen(3000);
```

## Using together with kraken.js

Here is meddleware config sample, which can be used in a standard **kraken.js** application:

```json
{
  "middleware": {
    "expressPromBundle": {
      "route": "/((?!status|favicon.ico|robots.txt))*",
      "priority": 0,
      "module": {
        "name": "express-prom-bundle",
        "arguments": [
          {
            "includeMethod": true,
            "buckets": [0.1, 1, 5]
          }
        ]
      }
    }
  }
}
```

## Changelog

 * **2.1.0**
    * deprecate **excludeRoutes**, use **req.originalPath** instead of **req.path**
 * **2.0.0**
    * the reason for the version lift were:
      * compliance to official naming recommendation: https://prometheus.io/docs/practices/naming/
      * stopping promotion of an anti-pattern - see https://groups.google.com/d/msg/prometheus-developers/XjlOnDCK9qc/ovKzV3AIBwAJ
      * dealing with **prom-client** being a singleton with a built-in registry
    * main histogram metric renamed from `http_request_seconds` to `http_request_duration_seconds`
    * options removed: **prefix**, **keepDefaultMetrics**
    * factory removed (as the only reason of it was adding the prefix)
    * upgrade prom-client to 6.3.0
    * code style changed to the one closer to express


 * **1.2.1**
    * upgrade prom-client to 6.1.2
    * add options: includeMethod, includePath, keepDefaultMetrics

## License

MIT
