'use strict';

module.exports = function(res, opts) {
  opts = opts || {};

  if (typeof opts.formatStatusCode === 'function') {
    return opts.formatStatusCode(res, opts);
  }

  return res.status_code;
};
