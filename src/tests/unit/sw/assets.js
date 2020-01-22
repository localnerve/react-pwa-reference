/***
 * Copyright (c) 2016 - 2019 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global Promise, after, before, describe, it */

const _ = require('lodash');
const expect = require('chai').expect;
const mocks = require('test/mocks');
const urlm = require('utils/urls');

describe('sw/assets', () => {
  let data, toolbox, assets;
  const mockFetchUnexpected = new Error('unexpected mockFetch results');

  before('setup sw/assets', function () {
    this.timeout(5000);

    mocks.swToolbox.begin();
    mocks.swData.begin();
    data = require('sw/data');
    toolbox = require('sw-toolbox');
    global.Request = require('test/mocks/request');

    assets = require('application/client/sw/assets');
  });

  after(() => {
    toolbox.mockTeardown();
    mocks.swData.end();
    mocks.swToolbox.end();
    delete global.Request;
  });

  it('should populate precache with data assets', () => {
    toolbox.mockSetup();
    assets.setupAssetRequests();

    const diff = _.xor(
      data.assets,
      toolbox.options.preCacheItems.map((req) => {
        expect(req).to.be.a('string').that.is.not.empty;
        return req;
      })
    );

    expect(diff.length).to.equal(0);
  });

  it('should populate route map as expected', () => {
    toolbox.mockSetup();
    assets.setupAssetRequests();

    const hostnames = _.uniq(data.assets.map((asset) => {
      return urlm.getHostname(asset);
    }));

    expect(toolbox.router.routes.size).to.equal(hostnames.length);
  });

  it('should handle asset requests successfully', (done) => {
    const response = { test: 'yep' };

    toolbox.mockSetup(response);
    assets.setupAssetRequests();

    // fetch all the assets and check the responses.
    Promise.all(data.assets.map((asset) => {
      return toolbox.mockFetch(asset, 'GET');
    })).then((results) => {
      results.forEach((res) => {
        expect(res).to.eql(response);
      });

      if (results && results.length > 0) {
        done();
      } else {
        done(mockFetchUnexpected);
      }
    }).catch((error) => {
      done(error || mockFetchUnexpected);
    });
  });

  // questionable utility
  it('should not handle bogus request', (done) => {
    toolbox.mockSetup();
    assets.setupAssetRequests();

    Promise.all([
      'http://bogushost1/somepath1',
      'http://bogushost2/somepath2'
    ].map((url) => {
      return toolbox.mockFetch(url, 'GET');
    })).then((results) => {
      results.forEach((res) => {
        expect(res).to.be.undefined;
      });

      if (results && results.length > 0) {
        done();
      } else {
        done(mockFetchUnexpected);
      }
    }).catch((error) => {
      done (error || mockFetchUnexpected);
    });
  });
});
