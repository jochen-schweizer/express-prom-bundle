'use strict';

module.exports = function(res) {
  return res.status_code || res.statusCode;
};
