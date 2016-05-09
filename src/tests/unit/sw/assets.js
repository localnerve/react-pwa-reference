/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global Promise, after, before, describe, it */
'use strict';

var _ = require('lodash');
var expect = require('chai').expect;
var mocks = require('test/mocks');
var urlm = require('utils/urls');

describe('sw/assets', function () {
  var data, toolbox, assets,
    mockFetchUnexpected = new Error('unexpected mockFetch results');

  before('setup sw/assets', function () {
    this.timeout(5000);

    mocks.swToolbox.begin();
    mocks.swData.begin();
    data = require('sw/data');
    toolbox = require('sw-toolbox');
    global.Request = require('test/mocks/request');

    assets = require('application/client/sw/assets');
  });

  after(function () {
    toolbox.mockTeardown();
    mocks.swData.end();
    mocks.swToolbox.end();
    delete global.Request;
  });

  it('should populate precache with data assets', function () {
    toolbox.mockSetup();
    assets.setupAssetRequests();

    var diff = _.xor(
      data.assets,
      toolbox.options.preCacheItems.map(function (req) {
        expect(req).to.be.a('string').that.is.not.empty;
        return req;
      })
    );

    expect(diff.length).to.equal(0);
  });

  it('should populate route map as expected', function () {
    toolbox.mockSetup();
    assets.setupAssetRequests();

    var hostnames = _.uniq(data.assets.map(function (asset) {
      return urlm.getHostname(asset);
    }));

    expect(toolbox.router.routes.size).to.equal(hostnames.length);
  });

  it('should handle asset requests successfully', function (done) {
    var response = { test: 'yep' };

    toolbox.mockSetup(response);
    assets.setupAssetRequests();

    // fetch all the assets and check the responses.
    Promise.all(data.assets.map(function (asset) {
      return toolbox.mockFetch(asset, 'GET');
    })).then(function (results) {
      results.forEach(function (res) {
        expect(res).to.eql(response);
      });

      if (results && results.length > 0) {
        done();
      } else {
        done(mockFetchUnexpected);
      }
    }).catch(function (error) {
      done(error || mockFetchUnexpected);
    });
  });

  // questionable utility
  it('should not handle bogus request', function (done) {
    toolbox.mockSetup();
    assets.setupAssetRequests();

    Promise.all([
      'http://bogushost1/somepath1',
      'http://bogushost2/somepath2'
    ].map(function (url) {
      return toolbox.mockFetch(url, 'GET');
    })).then(function (results) {
      results.forEach(function (res) {
        expect(res).to.be.undefined;
      });

      if (results && results.length > 0) {
        done();
      } else {
        done(mockFetchUnexpected);
      }
    }).catch(function (error) {
      done (error || mockFetchUnexpected);
    });
  });
});
