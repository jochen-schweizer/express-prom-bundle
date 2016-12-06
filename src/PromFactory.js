"use strict";

module.exports = class {
    constructor(opts) {
        this.opts = opts || {};
        this.promClient = this.opts.promClient || require("prom-client");
    }

    makeRealName(name) {
        return (this.opts.prefix || "") + name;
    }

    makeMetric(TheClass, args) {
        // convert pseudo-array
        const applyParams = Array.prototype.slice.call(args);
        const name = applyParams[0];
        const realName = this.makeRealName(name);

        const existing = this.promClient.register.getSingleMetric(realName);
        if (existing) {
            return existing;
        }

        applyParams[0] = realName;
        applyParams.unshift(null); // add some dummy context for apply

        // call constructor with variable params
        return new (Function.prototype.bind.apply(TheClass, applyParams)); // eslint-disable-line
    }

    newCounter() {
        return this.makeMetric(this.promClient.Counter, arguments);
    }

    newGauge() {
        return this.makeMetric(this.promClient.Gauge, arguments);
    }

    newHistogram() {
        return this.makeMetric(this.promClient.Histogram, arguments);
    }

    newSummary() {
        return this.makeMetric(this.promClient.Summary, arguments);
    }
};
