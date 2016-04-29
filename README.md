[![build status](https://travis-ci.org/jochen-schweizer/express-prom-bundle.png)](https://travis-ci.org/jochen-schweizer/express-prom-bundle)

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
const
    promBundle = require("express-prom-bundle"),
    middleware = promBundle({/* options */ });
```

## Options

 * **prefix**:  prefix added to every metric name
 * **whitelist**, **blacklist**: array of strings or regexp. These which metrics to include/exclude

## Example

setup std. metrics but exclude `up`-metric:

```javascript
"use strict";

const express = require("express"),
    app = express(),
    promBundle = require("express-prom-bundle");

app.use(promBundle({
    prefix: "demo_app:something",
    blacklist: ["up"]
}));

app.get("/hello", (req, res) => res.send("ok"));

app.listen(3000);
```

## License

MIT