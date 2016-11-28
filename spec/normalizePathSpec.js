"use strict";
/* eslint-env jasmine */

const normalizePath = require("../src/normalizePath");

describe("normalizePath", () => {
    it("returns original if disabled in opts", () => {
        expect(
          normalizePath({originalUrl: "/a/12345"}, {normalizePath: false})
        ).toBe("/a/12345");
    });

    it("returns run callback if configured", () => {
        expect(
            normalizePath(
                {originalUrl: "/a/12345"},
                {
                    normalizePath: req => req.originalUrl + "-ok"
                }
            )
        ).toBe("/a/12345-ok");
    });

    it("uses UrlValueParser by default", () => {
        expect(normalizePath({originalUrl: "/a/12345"}))
            .toBe("/a/#val");
    });
});
