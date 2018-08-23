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

## Usage with Node Cluster
``` javascript
if (cluster.isMaster) {
    const numCPUs = Math.max(2, os.cpus().length);
    const workers: cluster.Worker[] = [];
    for (let i=1; i < numCPUs; i++) {
        const worker = forkWorker();
        workers.push(worker);
    }
    const metricsApp = express();
    metricsApp.use('/cluster_metrics', promBundle({clusterMaster: true}));
    metricsApp.listen(9999);
    console.log('metrics listening on 9999'); // call localhost:9999/cluster_metrics for aggregated metrics
} else {
    const app = express();
    app.use(promBundle({includeMethod: true});
    app.use('/api', require('./api'));
    app.listen(3000);
}
```
The code the master process runs will expose an API with a single endpoint `/cluster_metrics` which returns an aggregate of all metrics from all the workers.

## Options

Which labels to include in `http_request_duration_seconds` metric:

* **includeStatusCode**: HTTP status code (200, 400, 404 etc.), default: **true**
* **includeMethod**: HTTP method (GET, PUT, ...), default: **false**
* **includePath**: URL path (see importent details below), default: **false**
* **customLabels**: an object containing extra labels, e.g. ```{project_name: 'hello_world'}```.
  Most useful together with **transformLabels** callback, otherwise it's better to use native Prometheus relabeling.

Extra transformation callbacks:

* **normalizePath**: `function(req)`  or `Array`
  * if function is provided, then it should generate path value from express `req`
  * if array is provided, then it should be an array of tuples `[regex, replacement]`. The `regex` can be a string and is automatically converted into JS regex.
  * ... see more details in the section below
* **urlValueParser**: options passed when instantiating [url-value-parser](https://github.com/disjunction/url-value-parser).
  This is the easiest way to customize which parts of the URL should be replaced with "#val".
  See the [docs](https://github.com/disjunction/url-value-parser) of url-value-parser module for details.
* **formatStatusCode**: `function(res)` producing final status code from express `res` object, e.g. you can combine `200`, `201` and `204` to just `2xx`.
* **transformLabels**: `function(labels, req, res)` transforms the **labels** object, e.g. setting dynamic values to **customLabels**

Other options:

* **buckets**: buckets used for `http_request_duration_seconds` histogram
* **autoregister**: if `/metrics` endpoint should be registered. (Default: **true**)
* **promClient**: options for promClient startup, e.g. **collectDefaultMetrics**. This option was added
  to keep `express-prom-bundle` runnable using confit (e.g. with kraken.js) without writing any JS code,
  see [advanced example](https://github.com/jochen-schweizer/express-prom-bundle/blob/master/advanced-example.js)

### More details on includePath option

Let's say you want to have  latency statistics by URL path,
e.g. separate metrics for `/my-app/user/`, `/products/by-category` etc.

Just taking `req.path` as a label value won't work as IDs are often part of the URL,
like `/user/12352/profile`. So what we actually need is a path template.
The module tries to figure out what parts of the path are values or IDs,
and what is an actual path. The example mentioned before would be
normalized to `/user/#val/profile` and that will become the value for the label.
These conversions are handled by `normalizePath` function.

You can extend this magical behavior by providing
additional RegExp rules to be performed,
or override `normalizePath` with your own function.

#### Example 1 (add custom RegExp):

```javascript
app.use(promBundle({
  normalizePath: [
    // collect paths like "/customer/johnbobson" as just one "/custom/#name"
    ['^/customer/.*', '/customer/#name'],

    // collect paths like "/bobjohnson/order-list" as just one "/#name/order-list"
    ['^.*/order-list', '/#name/order-list']
  ],
  urlValueParser: {
    minHexLength: 5,
    extraMasks: [
      'ORD[0-9]{5,}' // replace strings like ORD1243423, ORD673562 as #val
    ]
  }
}));
```

#### Example 2 (override normalizePath function):

```javascript
app.use(promBundle(/* options? */));

// let's reuse the existing one and just add some
// functionality on top
const originalNormalize = promBundle.normalizePath;
promBundle.normalizePath = (req, opts) => {
  const path = originalNormalize(req, opts);
  // count all docs as one path, but /docs/login as a separate one
  return (path.match(/^\/docs/) && !path.match(/^\/login/)) ? '/docs/*' : path;
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

Here is meddleware config sample, which can be used in a standard **kraken.js** application.
In this case the stats for URI paths and HTTP methods are collected separately,
while replacing all HEX values starting from 5 characters and all emails in the path as #val.

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
            "includePath": true,
            "buckets": [0.1, 1, 5],
            "promClient": {
              "collectDefaultMetrics": {
                "timeout": 2000
              }
            },
            "urlValueParser": {
              "minHexLength": 5,
              "extraMasks": [
                "^[0-9]+\\.[0-9]+\\.[0-9]+$"
              ]
            }
          }
        ]
      }
    }
  }
}
```

## License

MIT
