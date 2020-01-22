/**
 * Copyright (c) 2016 - 2020 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global before, beforeEach, after, describe, it */

import { expect } from 'chai';
import mocks from 'test/mocks';

const config = require('configs').create().data;

describe('data/fetch', () => {
  let fetch, cache, request;
  const expectedError = new Error('Expected error');

  before(function () {
    this.timeout(5000);

    mocks.requestLib.begin();
    fetch = require('application/server/services/data/fetch');
    cache = require('./cache-interface');
    request = require('request');
  });

  after(() => {
    mocks.requestLib.end();
  });

  beforeEach(() => {
    request.setEmulateError(false);
    request.setNoData(false);
  });

  describe('fetchOne', () => {
    it('should fetch the FRED if no url supplied', (done) => {
      fetch.fetchOne({ resource: 'test' }, (err, res) => {
        if (err) {
          return done(err);
        }

        expect(res).to.equal(cache.get());
        expect(request.url).to.equal(config.FRED.url());

        done();
      });
    });

    it('should fetch the supplied url', (done) => {
      const supplied = '123456789';
      fetch.fetchOne({ resource: 'test', url: supplied }, (err, res) => {
        if (err) {
          return done(err);
        }

        expect(res).to.equal(cache.get());
        expect(request.url).to.contain(supplied);

        done();
      });
    });

    it('should fail if no data', (done) => {
      request.setNoData(true);

      fetch.fetchOne({ resource: 'test' }, (err) => {
        if (err) {
          return done();
        }

        done(expectedError);
      });
    });

    it('should fail if network fails', (done) => {
      request.setEmulateError(true);

      fetch.fetchOne({ resource: 'test' }, (err) => {
        if (err) {
          return done();
        }

        done(expectedError);
      });
    });

    it('should fail if resource not found after fetch', (done) => {
      const resourceName = 'miss';
      fetch.fetchOne({ resource: resourceName }, (err) => {
        if (err) {
          expect(err.toString()).to.contain(resourceName);
          return done();
        }

        done(expectedError);
      });
    });
  });

  describe('fetchMain', () => {
    it('should fetch the main resource', (done) => {
      fetch.fetchMain((err, res) => {
        if (err) {
          return done(err);
        }

        expect(res).to.equal(cache.get('routes'));
        expect(request.url).to.equal(config.FRED.url());

        done();
      });
    });
  });

  describe('fetchAll', () => {
    it('should fetch all resources', (done) => {
      fetch.fetchAll((err, res) => {
        if (err) {
          return done(err);
        }

        const routes = cache.get('routes');

        // It should return content for each route
        expect(Object.keys(routes).length).to.equal(res.length);
        if (res.length > 0) {
          // And they should be the default response
          expect(res[0]).to.equal(cache.get());
        }

        done();
      });
    });

    it('should fail if network fails', (done) => {
      request.setEmulateError(true);

      fetch.fetchAll((err) => {
        if (err) {
          return done();
        }

        done(expectedError);
      });
    });
  });

  describe('isManifestRequest', () => {
    it('should positively identify manifest request', () => {
      const result = fetch.isManifestRequest({
        resource: config.FRED.mainResource
      });
      expect(result).to.be.true;
    });

    it('should negatively identify manifest request', () => {
      const result = fetch.isManifestRequest({
        resource: 'settings'
      });
      expect(result).to.be.false;
    });

    it('should handle bad input', () => {
      const result = fetch.isManifestRequest();
      expect(result).to.be.false;
    });
  });
});
