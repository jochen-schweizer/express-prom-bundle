'use strict';
/* eslint-env jasmine */

const normalizePath = require('../src/normalizePath');

describe('normalizePath', () => {
  it('uses UrlValueParser by default', () => {
    expect(normalizePath({url: '/a/12345'}))
      .toBe('/a/#val');
  });

  it('uses normalizePath option', () => {
    const url = '/hello/world/i/am/finally/free!!!';
    const result = normalizePath({url}, {
      normalizePath: [
        ['/hello','/goodbye'],
        ['[^/]+$','happy'],
      ]
    });
    expect(result).toBe('/goodbye/world/i/am/finally/happy');
  });

  it('throws error is bad tuples provided as normalizePath', () => {
    const subject = () => normalizePath({url: '/test'}, {
      normalizePath: [
        ['/hello','/goodbye', 'test']
      ]
    });
    expect(subject).toThrow();
  });
});
