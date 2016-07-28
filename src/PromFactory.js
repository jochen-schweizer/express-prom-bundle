"use strict";

module.exports = class {
    constructor(opts) {
        this.opts = opts || {};
        this.promClient = this.opts.promClient || require("prom-client");
        this.metrics = {};
    }

    metricExists(name) {
        return !!this.metrics[name];
    }

    checkDuplicate(name) {
        if (this.metricExists(name)) {
            throw new Error("trying to add already existing metric: " + name);
        }
    }

    makeRealName(name) {
        return (this.opts.prefix || "") + name;
    }

    makeMetric(TheClass, args) {
        // convert pseudo-array
        const applyParams = Array.prototype.slice.call(args);
        const name = applyParams[0];
        this.checkDuplicate(name);
        const realName = this.makeRealName(name);
        applyParams[0] = realName;
        applyParams.unshift(null); // add some dummy context for apply

        // call constructor with variable params
        this.metrics[name] = new (Function.prototype.bind.apply(TheClass, applyParams));
        return this.metrics[name];
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