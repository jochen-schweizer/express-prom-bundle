'use strict';

const UrlValueParser = require('url-value-parser');

// ATTENTION! urlValueParser is a singleton!
let urlValueParser;

const ABSOLUTE_URL = /^[a-z][a-z0-9+.-]*:\/\//i;

// extracts the path from a request target, i.e. drops ?query and #fragment.
// Normally the target is a plain path, but in absolute-form
// (e.g. "GET http://host/path", used by proxies) the origin is dropped too
function extractPath(target) {
  if (ABSOLUTE_URL.test(target)) {
    try {
      return new URL(target).pathname;
    } catch (err) {
      // malformed absolute URL: fall through and treat it as a plain string
    }
  }
  const end = target.search(/[?#]/);
  return end === -1 ? target : target.slice(0, end);
}

module.exports = function(req, opts) {
  // originalUrl is taken, because url and path can be changed
  // by middlewares such as 'router'. Note: this function is called onFinish
  /// i.e. always in the tail of the middleware chain
  let path = extractPath(req.originalUrl || req.url);
  const urlPathReplacement = opts ? opts.urlPathReplacement : '#val';

  const normalizePath = opts && opts.normalizePath;
  if (Array.isArray(normalizePath)) {
    for (const tuple of normalizePath) {
      if (!Array.isArray(tuple) || tuple.length !== 2) {
        throw new Error('Bad tuple provided in normalizePath option, expected: [regex, replacement]');
      }
      const regex = typeof tuple[0] === 'string' ? RegExp(tuple[0]) : tuple[0];
      path = path.replace(regex, tuple[1]);
    }
  }

  if (!urlValueParser) {
    urlValueParser = new UrlValueParser(opts && opts.urlValueParser);
  }
  return urlValueParser.replacePathValues(path, urlPathReplacement);
};
