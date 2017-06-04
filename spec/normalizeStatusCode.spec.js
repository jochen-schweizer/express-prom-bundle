'use strict';
/* eslint-env jasmine */

const normalizeStatusCode = require('../src/normalizeStatusCode');

describe('normalizeStatusCode', () => {
  it('returns run callback if configured', () => {
    expect(
      normalizeStatusCode({status_code: 500})
    ).toBe(500);
  });
});
