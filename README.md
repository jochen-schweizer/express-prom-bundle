[![build status](https://api.travis-ci.org/disjunction/express-prom-bundle.png)](https://travis-ci.org/disjunction/express-prom-bundle)

# express prometheus bundle

express middleware with popular prometheus metrics in one bundle.

Internally it uses **prom-client**. See: https://github.com/siimon/prom-client

Included metrics:
    
* `up`: normally is just 1
* `nodejs_memory_heap_total_bytes` and `nodejs_memory_heap_used_bytes`
* `http_request_total`: count of http requests labeled with status_code

## Install

```
npm install express-prom-bundle
```

## Usage

```javascript
const
    promBundle = require("express-prom-bundle"),
    middleware = promBundle({/* options */ });
```

## Options

 * **prefix**:  prefix added to every metric name

## Example

```javascript
"use strict";

const express = require("express"),
    app = express(),
    promBundle = require(".");

app.use(promBundle({
    prefix: "demo_app:something"
}));

app.get("/hello", (req, res) => res.send("ok"));

app.listen(3000);
```