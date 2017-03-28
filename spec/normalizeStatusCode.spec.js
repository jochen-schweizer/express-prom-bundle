'use strict';
/* eslint-env jasmine */

const normalizeStatusCode = require('../src/normalizeStatusCode');

describe('normalizeStatusCode', () => {
  it('returns original if disabled in opts', () => {
    expect(
     normalizeStatusCode({status_code: 404}, {normalizeStatusCode: false})
   ).toBe(404);
  });

  it('returns run callback if configured', () => {
    expect(
      normalizeStatusCode(
        {status_code: 500},
        {
          formatStatusCode: res => String(res.status_code).slice(0, -2) + 'xx'
        }
      )
    ).toBe('5xx');
  });
});
