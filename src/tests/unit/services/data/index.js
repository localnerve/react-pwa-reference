/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
 /* global before, after, beforeEach, describe, it */
'use strict';

var expect = require('chai').expect;
var mocks = require('../../../mocks');

describe('data/index', function () {
  var data, cache, fetchLib;

  before(function () {
    this.timeout(5000);

    mocks.fetch.begin();
    data = require('application/server/services/data');
    cache = require('./cache-interface');
    fetchLib = require('./fetch');
  });

  after(function () {
    mocks.fetch.end();
  });

  beforeEach(function () {
    cache.mockReset();
    fetchLib.mockReset();
  });

  describe('fetch', function () {
    it('should pull from cache if exists', function (done) {
      data.fetch({}, function (err, res) {
        if (err) {
          done(err);
        }

        expect(res).to.equal(cache.get());
        done();
      });
    });

    it('should fetch if not in cache', function (done) {
      data.fetch({ resource: 'miss' }, function (err, res) {
        if (err) {
          done(err);
        }

        expect(res).to.equal('fetch');
        done();
      });
    });

    it('should fetch using find spec if not in cache', function (done) {
      data.fetch({ resource: 'find' }, function (err, res) {
        if (err) {
          done(err);
        }

        var callCounts = cache.mockCounts();
        var params = fetchLib.mockParams();

        expect(callCounts.get).to.equal(1);
        expect(callCounts.find).to.equal(1);
        expect(params).to.equal(cache.find());
        expect(res).to.equal('fetch');
        done();
      });
    });
  });

  describe('initialize', function () {
    it('should initialize', function (done) {
      data.initialize(done);
    });
  });

  describe('update', function () {
    it('should update', function (done) {
      data.update(done);
    });
  });
});
