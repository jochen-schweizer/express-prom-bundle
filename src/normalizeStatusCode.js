'use strict';

module.exports = function(res, opts) {
  opts = opts || {};

  if (opts.formatStatusCode !== undefined && !opts.formatStatusCode) {
    return req.status_code;
  }
  if (typeof opts.formatStatusCode === 'function') {
    return opts.formatStatusCode(res, opts);
  }

  return res.status_code;
};
