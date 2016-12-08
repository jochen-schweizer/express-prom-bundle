'use strict';

const UrlValueParser = require('url-value-parser');
const url = require('url');
let urlValueParser;

module.exports = function(req, opts) {
  opts = opts || {};

  // originalUrl is taken, because url and path can be changed
  // by middlewares such as 'router'. Note: this function is called onFinish
  /// i.e. always in the tail of the middleware chain
  const path = url.parse(req.originalUrl).pathname;

  if (opts.normalizePath !== undefined && !opts.normalizePath) {
    return path;
  }
  if (typeof opts.normalizePath === 'function') {
    return opts.normalizePath(req, opts);
  }

  if (!urlValueParser) {
    urlValueParser = new UrlValueParser();
  }
  return urlValueParser.replacePathValues(path);
};

