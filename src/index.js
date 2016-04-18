"use strict";

const
    PrometheusHelper = require("./PrometheusHelper"),
    onFinished = require("on-finished");

function filterArrayByRegExps(array, regexps) {
    let compiled = regexps.map(regexp => new RegExp(regexp));
    return array.filter(element => {
        for (let regexp of compiled) {
            if (element.match(regexp)) {
                return true;
            }
        }
        return false;
    });
}

function main(opts) {
    if (arguments[2] && arguments[1] && arguments[1].send) {
        arguments[1].status(500)
            .send("<h1>500 Error</h1>\n"
                + "<p>Unexapected 3d param.\n"
                + "<p>Did you just put express-prom-bundle into app.use "
                + "without calling it as a function first?");
        return;
    }

    let helper = new PrometheusHelper(opts);
    let metricTemplates = {
        "up": () => helper.newGauge(
            "up",
            "1 = up, 0 = not up"
        ),
        "nodejs_memory_heap_total_bytes": () => helper.newGauge(
            "nodejs_memory_heap_total_bytes",
            "value of process.memoryUsage().heapTotal"
        ),
        "nodejs_memory_heap_used_bytes": () => helper.newGauge(
            "nodejs_memory_heap_used_bytes",
            "value of process.memoryUsage().heapUsed"
        ),
        "http_request_total": () => helper.newCounter(
            "http_request_total",
            "number of http responses labeled with status code",
            ["status_code"]
        )
    };

    const metrics = {};

    for (let name of Object.keys(metricTemplates)) {
        metrics[name] = metricTemplates[name]();
    }

    metrics.up.set(1);

    let middleware = function (req, res, next) {
        if (req.path == "/metrics") {
            let memoryUsage = process.memoryUsage();
            metrics["nodejs_memory_heap_total_bytes"].set(memoryUsage.heapTotal);
            metrics["nodejs_memory_heap_used_bytes"].set(memoryUsage.heapUsed);

            res.contentType("text/plain")
                .send(helper.promClient.register.metrics());
            return;
        }

        onFinished(res, () => {
            if (res.statusCode) {
                metrics["http_request_total"].inc({"status_code": res.statusCode});
            }
        });

        next();
    };

    middleware.helper = helper;
    middleware.metricTemplates = metricTemplates;

    return middleware;
}

module.exports = main;