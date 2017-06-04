'use strict';
/* eslint-env jasmine */

const normalizePath = require('../src/normalizePath');

describe('normalizePath', () => {
  it('uses UrlValueParser by default', () => {
    expect(normalizePath({url: '/a/12345'}))
      .toBe('/a/#val');
  });
});
