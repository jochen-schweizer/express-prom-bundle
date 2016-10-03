"use strict";

const
    PromFactory = require("./PromFactory"),
    onFinished = require("on-finished");

function matchVsRegExps(element, regexps) {
    for (let regexp of regexps) {
        if (regexp instanceof RegExp) {
            if (element.match(regexp)) {
                return true;
            }
        } else if (element == regexp) {
            return true;
        }
    }
    return false;
}


function filterArrayByRegExps(array, regexps) {
    return array.filter(element => {
        return matchVsRegExps(element, regexps);
    });
}

function prepareMetricNames(opts, metricTemplates) {
    const names = Object.keys(metricTemplates);
    if (opts.whitelist) {
        if (opts.blacklist) {
            throw new Error("you cannot have whitelist and blacklist at the same time");
        }
        return filterArrayByRegExps(names, opts.whitelist);
    }
    if (opts.blacklist) {
        const blacklisted = filterArrayByRegExps(names, opts.blacklist);
        return names.filter(name => blacklisted.indexOf(name) === -1);
    }
    return names;
}

function main(opts) {
    opts = Object.assign({ autoregister: true }, opts || {} );
    if (arguments[2] && arguments[1] && arguments[1].send) {
        arguments[1].status(500)
            .send("<h1>500 Error</h1>\n"
                + "<p>Unexapected 3rd param in express-prom-bundle.\n"
                + "<p>Did you just put express-prom-bundle into app.use "
                + "without calling it as a function first?");
        return;
    }

    const factory = new PromFactory(opts);

    const metricTemplates = {
        "up": () => factory.newGauge(
            "up",
            "1 = up, 0 = not up"
        ),
        "nodejs_memory_heap_total_bytes": () => factory.newGauge(
            "nodejs_memory_heap_total_bytes",
            "value of process.memoryUsage().heapTotal"
        ),
        "nodejs_memory_heap_used_bytes": () => factory.newGauge(
            "nodejs_memory_heap_used_bytes",
            "value of process.memoryUsage().heapUsed"
        ),
        "http_request_seconds": () => {
            const metric = factory.newHistogram(
                "http_request_seconds",
                "number of http responses labeled with status code",
                ["status_code"],
                {
                    buckets: opts.buckets || [0.003, 0.03, 0.1, 0.3, 1.5, 10]
                }
            );
            return metric;
        }
    };

    const
        metrics = {},
        names = prepareMetricNames(opts, metricTemplates);


    for (let name of names) {
        metrics[name] = metricTemplates[name]();
    }

    if (metrics.up) {
        metrics.up.set(1);
    }

    const metricsMiddleware = function(req,res) {
        let memoryUsage = process.memoryUsage();
        if (metrics["nodejs_memory_heap_total_bytes"]) {
            metrics["nodejs_memory_heap_total_bytes"].set(memoryUsage.heapTotal);
        }
        if (metrics["nodejs_memory_heap_used_bytes"]) {
            metrics["nodejs_memory_heap_used_bytes"].set(memoryUsage.heapUsed);
        }

        res.contentType("text/plain").send(factory.promClient.register.metrics());
        return;
    };

    const middleware = function (req, res, next) {
        if (opts.autoregister && req.path == "/metrics") {
            return metricsMiddleware(req,res);
        }

        if (opts.excludeRoutes && matchVsRegExps(req.path, opts.excludeRoutes)) {
            return next();
        }

        let labels;
        if (metrics["http_request_seconds"]) {
            labels = {"status_code": 0};
            let timer = metrics["http_request_seconds"].startTimer(labels);
            onFinished(res, () => {
                labels["status_code"] = res.statusCode;
                timer();
            });
        }

        next();
    };

    middleware.factory = factory;
    middleware.metricTemplates = metricTemplates;
    middleware.metrics = metrics;
    middleware.promClient = factory.promClient;
    middleware.metricsMiddleware = metricsMiddleware;
    return middleware;
}

module.exports = main;
