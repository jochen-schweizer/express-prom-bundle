[![build status](https://travis-ci.org/jochen-schweizer/express-prom-bundle.png)](https://travis-ci.org/jochen-schweizer/express-prom-bundle) [![Coverage Status](https://coveralls.io/repos/github/jochen-schweizer/express-prom-bundle/badge.svg?branch=master)](https://coveralls.io/github/jochen-schweizer/express-prom-bundle?branch=master) [![license](https://img.shields.io/github/license/mashape/apistatus.svg?maxAge=2592000)](https://www.tldrlegal.com/l/mit) [![NPM version](https://badge.fury.io/js/express-prom-bundle.png)](http://badge.fury.io/js/express-prom-bundle)

# express prometheus bundle

Express middleware with popular prometheus metrics in one bundle. It's also compatible with koa v1 and v2 (see below).

Internally it uses **prom-client**. See: https://github.com/siimon/prom-client

Included metrics:

* `up`: normally is just 1
* `http_request_duration_seconds`: http latency histogram labeled with `status_code`, `method` and `path`

## Install

```
npm install express-prom-bundle
```

## Sample Usage

```javascript
const promBundle = require("express-prom-bundle");
const app = require("express")();
const metricsMiddleware = promBundle({includeMethod: true});

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

Which labels to include in `http_request_duration_seconds` metric:

* **includeStatusCode**: HTTP status code (200, 400, 404 etc.), default: **true**
* **includeMethod**: HTTP method (GET, PUT, ...), default: **false**
* **includePath**: URL path (see importent details below), default: **false**
* **customLabels**: an object containing extra labels, e.g. ```{project_name: 'hello_world'}```.
  Most useful together with **transformLabels** callback, otherwise it's better to use native Prometheus relabeling.

Extra transformation callbacks:

* **normalizePath**: `function(req)` generates path values from express `req` (see details below)
* **formatStatusCode**: `function(res)` producing final status code from express `res` object, e.g. you can combine `200`, `201` and `204` to just `2xx`.
* **transformLabels**: `function(labels, req, res)` transforms the **labels** object, e.g. setting dynamic values to **customLabels**

Other options:

* **buckets**: buckets used for `http_request_duration_seconds` histogram
* **autoregister**: if `/metrics` endpoint should be registered. (Default: **true**)
* **promClient**: options for promClient startup, e.g. **collectDefaultMetrics**. This option was added
  to keep `express-prom-bundle` runnable using confit (e.g. with kraken.js) without writing any JS code,
  see [advanced example](https://github.com/jochen-schweizer/express-prom-bundle/blob/master/advanced-example.js)

Deprecated:

* **whitelist**, **blacklist**: array of strings or regexp specifying which metrics to include/exclude (there are only 2 metrics)
* **excludeRoutes**: array of strings or regexp specifying which routes should be skipped for `http_request_duration_seconds` metric. It uses `req.originalUrl` as subject when checking. You want to use express or meddleware features instead of this option.
* **httpDurationMetricName**: name of the request duration histogram metric. (Default: `http_request_duration_seconds`)

### More details on includePath option

Let's say you want to have  latency statistics by URL path,
e.g. separate metrics for `/my-app/user/`, `/products/by-category` etc.

Just taking `req.path` as a label value won't work as IDs are often part of the URL,
like `/user/12352/profile`. So what we actually need is a path template.
The module tries to figure out what parts of the path are values or IDs,
and what is an actual path. The example mentioned before would be
normalized to `/user/#val/profile` and that will become the value for the label.

You can override this magical behavior and define your own function by
providing an optional callback using **normalizePath** option.
You can also replace the default **normalizePath** function globally.

```javascript
app.use(promBundle(/* options? */));

// let's reuse the existing one and just add some
// functionality on top
const originalNormalize = promBundle.normalizePath;
promBundle.normalizePath = (req, opts) => {
  const path = originalNormalize(req, opts);
  // count all docs (no matter which file) as a single path
  return path.match(/^\/docs/) ? '/docs/*' : path;
};
```

For more details:
 * [url-value-parser](https://www.npmjs.com/package/url-value-parser) - magic behind automatic path normalization
 * [normalizePath.js](https://github.com/jochen-schweizer/express-prom-bundle/blob/master/src/normalizePath.js) - source code for path processing



## express example

setup std. metrics but exclude `up`-metric:

```javascript
const express = require("express");
const app = express();
const promBundle = require("express-prom-bundle");

// calls to this route will not appear in metrics
// because it's applied before promBundle
app.get("/status", (req, res) => res.send("i am healthy"));

// register metrics collection for all routes
// ... except those starting with /foo
app.use("/((?!foo))*", promBundle({includePath: true}));

// this call will NOT appear in metrics,
// because express will skip the metrics middleware
app.get("/foo", (req, res) => res.send("bar"));

// calls to this route will appear in metrics
app.get("/hello", (req, res) => res.send("ok"));

app.listen(3000);
```

See an [advanced example on github](https://github.com/jochen-schweizer/express-prom-bundle/blob/master/advanced-example.js)

## koa v2 example

```javascript
const promBundle = require("express-prom-bundle");
const Koa = require("koa");
const c2k = require("koa-connect");
const metricsMiddleware = promBundle({/* options */ });

const app = new Koa();

app.use(c2k(metricsMiddleware));
app.use(/* your middleware */);
app.listen(3000);
```

## using with kraken.js

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

 * **3.3.0**
    * added option **promClient** to be able to call collectDefaultMetrics
    * upgrade **prom-client** to ~10.2.2 (switch to semver "approximately")


 * **3.2.0**
    * added options **customLabels**, **transformLabels**
    * upgrade **prom-client** to 10.1.0


 * **3.1.0**
    * upgrade **prom-client** to 10.0.0


 * **3.0.0**
    * upgrade dependencies, most notably **prom-client** to 9.0.0
    * switch to koa v2 in koa unittest
    * only node v6 or higher is supported (stop supporting node v4 and v5)
    * switch to npm5 and use package-lock.json
    * options added: includeStatusCode, formatStatusCode


 * **2.1.0**
    * deprecate **excludeRoutes**, use **req.originalUrl** instead of **req.path**


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
