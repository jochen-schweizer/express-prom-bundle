'use strict';

module.exports = function(req, opts) {
  opts = opts || {};

  if (opts.formatStatusCode !== undefined && !opts.formatStatusCode) {
    return req.status_code;
  }
  if (typeof opts.formatStatusCode === 'function') {
    return opts.formatStatusCode(req, opts);
  }

  // Group Status code in 1xx, 2xx, 3xx, 4xx, 5xx or other
  const status_code = ({
    '1': '1xx',
    '2': '2xx',
    '3': '3xx',
    '4': '4xx',
    '5': '5xx',
  })[(req.status_code || '').substr(0,1)] || 'other';
  return status_code;
};
