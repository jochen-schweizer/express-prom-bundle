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
        const prefix = this.opts.prefix ? (this.opts.prefix + ":") : "";
        return prefix + name;
    }

    makeMetric(TheClass, name, description, param) {
        this.checkDuplicate(name);
        const realName = this.makeRealName(name);
        this.metrics[name] = new TheClass(
            realName, description, param
        );
        return this.metrics[name];
    }

    newCounter(name, description, labels) {
        return this.makeMetric(this.promClient.Counter, name, description, labels);
    }

    newGauge(name, description, labels) {
        return this.makeMetric(this.promClient.Gauge, name, description, labels);
    }

    newHistogram(name, description, options) {
        return this.makeMetric(this.promClient.Histogram, name, description, options);
    }

    newSummary(name, description, options) {
        return this.makeMetric(this.promClient.Histogram, name, description, options);
    }
};