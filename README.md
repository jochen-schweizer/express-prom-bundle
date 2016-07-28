[![build status](https://travis-ci.org/jochen-schweizer/express-prom-bundle.png)](https://travis-ci.org/jochen-schweizer/express-prom-bundle) [![Coverage Status](https://coveralls.io/repos/github/jochen-schweizer/express-prom-bundle/badge.svg?branch=master)](https://coveralls.io/github/jochen-schweizer/express-prom-bundle?branch=master) [![license](https://img.shields.io/github/license/mashape/apistatus.svg?maxAge=2592000)](https://www.tldrlegal.com/l/mit)

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

You **MUST** call `app.use(metricsMiddleware)` before the `use`-ing your middleware,
otherwise those won't count in `http_request_seconds` histogram

```javascript
const promBundle = require("express-prom-bundle"),
const metricsMiddleware = promBundle({/* options */ });

app.use(metricsMiddleware);
app.use(/* your middleware */);
app.listen(3000);
```

* call your endpoints
* see your metrics here: [http://localhost:3000/metrics](http://localhost:3000/metrics)

## Options

 * **prefix**:  prefix added to every metric name
 * **whitelist**, **blacklist**: array of strings or regexp specifying which metrics to include/exclude
 * **buckets**: buckets used for `http_request_seconds` histogram

## Example

setup std. metrics but exclude `up`-metric:

```javascript
"use strict";

const express = require("express"),
    app = express(),
    promBundle = require("express-prom-bundle");

app.use(promBundle({
    prefix: "demo_app:something"
}));

app.get("/hello", (req, res) => res.send("ok"));

app.listen(3000);
```

See an [advanced example on github](https://github.com/jochen-schweizer/express-prom-bundle/blob/master/advanced-example.js)

## License

MIT