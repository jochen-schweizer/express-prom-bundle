"use strict";
/* eslint-env jasmine */
const PromFactory = require("../src/PromFactory");

describe("PromFactory", () => {
    let factory;
    beforeEach(() => {
        factory = new PromFactory();
    });
    it("creates Counter", () => {
        const metric = factory.newCounter(
            "test1",
            "help for test1",
            ["label1", "label2"]
        );
        expect(metric.name).toBe("test1");
        expect(metric.help).toBe("help for test1");
        expect(metric.labelNames).toEqual(["label1", "label2"]);
    });
    it("creates Gauge", () => {
        const metric = factory.newGauge(
            "test2",
            "help for test2",
            ["label1", "label2"]
        );
        expect(metric.name).toBe("test2");
        expect(metric.help).toBe("help for test2");
        expect(metric.labelNames).toEqual(["label1", "label2"]);
    });
    it("creates Histogram with labels", () => {
        const metric = factory.newHistogram(
            "test3",
            "help for test3",
            ["label1", "label2"],
            {buckets: [1, 2, 3]}
        );
        expect(metric.name).toBe("test3");
        expect(metric.help).toBe("help for test3");
        expect(metric.labelNames).toEqual(["label1", "label2"]);
        expect(metric.bucketValues).toEqual({"1": 0, "2": 0, "3": 0});
    });
    it("creates Summary without labels", () => {
        const metric = factory.newSummary(
            "test4",
            "help for test4",
            {percentiles: [0.1, 0.5]}
        );
        expect(metric.name).toBe("test4");
        expect(metric.help).toBe("help for test4");
        expect(metric.percentiles).toEqual([0.1, 0.5]);
    });
    it("when regsitered with same name, just return old instance", () => {
        const metric1 = factory.newSummary(
            "test4",
            "help for test4",
            {percentiles: [0.1, 0.5]}
        );
        const metric2 = factory.newSummary(
            "test4",
            "help for test4",
            {percentiles: [0.1, 0.5]}
        );
        expect(metric1).toBe(metric2);
    });
});
