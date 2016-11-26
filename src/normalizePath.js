"use strict";

const UrlValueParser = require("url-value-parser");
let urlValueParser;

module.exports = function(req, opts) {
    opts = opts || {};
    if (opts.normalizePath !== undefined && !opts.normalizePath) {
        return req.path;
    }
    if (typeof opts.normalizePath === "function") {
        return opts.normalizePath(req, opts);
    }
    if (!urlValueParser) {
        urlValueParser = new UrlValueParser();
    }
    return urlValueParser.replacePathValues(req.path);
};
