/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
 /* global before, beforeEach, after, describe, it */
'use strict';

var expect = require('chai').expect;
var mocks = require('../../../mocks');

var config = require('../../../../configs').create().data;

describe('data/fetch', function () {
  var fetch, cache, request,
    expectedError = new Error('Expected error');

  before(function () {
    mocks.superAgent.begin();
    fetch = require('../../../../services/data/fetch');
    cache = require('./cache');
    request = require('superagent');
  });

  after(function () {
    mocks.superAgent.end();
  });

  beforeEach(function () {
    request.setEmulateError(false);
    request.setNoData(false);
  });

  describe('fetchOne', function () {
    it('should fetch the FRED if no url supplied', function (done) {
      fetch.fetchOne({ resource: 'test' }, function (err, res) {
        if (err) {
          return done(err);
        }

        expect(res).to.equal(cache.get());
        expect(request.url).to.equal(config.FRED.url());

        done();
      });
    });

    it('should fetch the supplied url', function (done) {
      var supplied = '123456789';
      fetch.fetchOne({ resource: 'test', url: supplied }, function (err, res) {
        if (err) {
          return done(err);
        }

        expect(res).to.equal(cache.get());
        expect(request.url).to.contain(supplied);

        done();
      });
    });

    it('should fail if no data', function (done) {
      request.setNoData(true);

      fetch.fetchOne({ resource: 'test' }, function (err) {
        if (err) {
          return done();
        }

        done(expectedError);
      });
    });

    it('should fail if network fails', function (done) {
      request.setEmulateError(true);

      fetch.fetchOne({ resource: 'test' }, function (err) {
        if (err) {
          return done();
        }

        done(expectedError);
      });
    });

    it('should fail if resource not found after fetch', function (done) {
      var resourceName = 'miss';
      fetch.fetchOne({ resource: resourceName }, function (err) {
        if (err) {
          expect(err.toString()).to.contain(resourceName);
          return done();
        }

        done(expectedError);
      });
    });
  });

  describe('fetchMain', function () {
    it('should fetch the main resource', function (done) {
      fetch.fetchMain(function (err, res) {
        if (err) {
          return done(err);
        }

        expect(res).to.equal(cache.get('routes'));
        expect(request.url).to.equal(config.FRED.url());

        done();
      });
    });
  });

  describe('fetchAll', function () {
    it('should fetch all resources', function (done) {
      fetch.fetchAll(function (err, res) {
        if (err) {
          return done(err);
        }

        var routes = cache.get('routes');

        // It should return content for each route
        expect(Object.keys(routes).length).to.equal(res.length);
        if (res.length > 0) {
          // And they should be the default response
          expect(res[0]).to.equal(cache.get());
        }

        done();
      });
    });

    it('should fail if network fails', function (done) {
      request.setEmulateError(true);

      fetch.fetchAll(function (err) {
        if (err) {
          return done();
        }

        done(expectedError);
      });
    });
  });

  describe('isManifestRequest', function () {
    it('should positively identify manifest request', function () {
      var result = fetch.isManifestRequest({
        resource: config.FRED.mainResource
      });
      expect(result).to.be.true;
    });

    it('should negatively identify manifest request', function () {
      var result = fetch.isManifestRequest({
        resource: 'settings'
      });
      expect(result).to.be.false;
    });

    it('should handle bad input', function () {
      var result = fetch.isManifestRequest();
      expect(result).to.be.false;
    });
  });
});
