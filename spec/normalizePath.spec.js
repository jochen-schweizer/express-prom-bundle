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

  it('uses urlPathReplacement when passed to transform the path', () => {
    expect(normalizePath({url: '/a/12345'}, {urlPathReplacement: ':id'}))
      .toBe('/a/:id');
  });

  describe('path extraction', () => {
    it('strips the query string', () => {
      expect(normalizePath({url: '/a/b?x=1&y=2'})).toBe('/a/b');
    });

    it('strips the fragment', () => {
      expect(normalizePath({url: '/a/b#frag#and_more'})).toBe('/a/b');
    });

    it('strips fragment that comes before query-like text', () => {
      expect(normalizePath({url: '/a/b#frag?x=1'})).toBe('/a/b');
    });

    it('keeps a path without query (trailing slash is dropped by url-value-parser)', () => {
      expect(normalizePath({url: '/a/b/'})).toBe('/a/b');
    });

    it('prefers originalUrl over url', () => {
      expect(normalizePath({originalUrl: '/orig?x=1', url: '/rewritten'})).toBe('/orig');
    });

    it('does not treat a leading double slash as a host', () => {
      // a URL parser would read "foo" as a host and return "/bar"
      expect(normalizePath({url: '//foo/bar?x=1'})).toBe('/foo/bar');
    });

    it('does not resolve dot segments', () => {
      expect(normalizePath({url: '/a/../b'})).toBe('/a/../b');
    });

    it('drops the origin of an absolute-form request target', () => {
      expect(normalizePath({url: 'http://example.com:8080/a/b?x=1'})).toBe('/a/b');
    });

    it('does not mistake a colon inside the path for a protocol', () => {
      // the empty segment between "//" is dropped by url-value-parser
      expect(normalizePath({url: '/a/http://b'})).toBe('/a/http:/b');
    });

    it('does not crash on malformed URL', () => {
      expect(normalizePath({url: '//%5Cfoo.bar:80@example.com'})).toBe('/%5Cfoo.bar:80@example.com');
    });
  });
});
