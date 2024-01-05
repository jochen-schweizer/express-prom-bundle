'use strict';
/* eslint-env jasmine */

const normalizeStatusCode = require('../src/normalizeStatusCode');

describe('normalizeStatusCode', () => {
  it('returns run callback if configured', () => {
    expect(
      normalizeStatusCode({status_code: 500, headersSent: true})
    ).toBe(500);
  });

  it('returns 499 if headers are not sent', () => {
    expect(normalizeStatusCode({statusCode: 200, headersSent: false})).toBe(499);
  });
});
