/***
 * Copyright (c) 2016 - 2019 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global Promise, after, before, describe, it */
import { expect } from 'chai';
import mocks from 'test/mocks';

describe('sw/init/backgrounds', () => {
  const mockFetchUnexpected = new Error('unexpected mockFetch results');
  const imageService = 'https://some-service';
  const backgroundUrls = {
    '1.jpg': imageService + '/some/path/1.jpg',
    '2.jpg': imageService + '/some/path/2.jpg'
  };
  const payload = {
    BackgroundStore: {
      backgroundUrls: backgroundUrls,
      imageServiceUrl: imageService
    }
  };
  let toolbox, backgrounds, treoMock;

  before('sw/init/backgrounds', function () {
    this.timeout(5000);

    global.Request = require('test/mocks/request');
    global.caches = require('test/mocks/sw-caches').create();
    mocks.swData.begin();
    mocks.swToolbox.begin();
    mocks.swUtilsIdbTreo.begin();

    treoMock = require('treo');
    treoMock.setValue(null);

    toolbox = require('sw-toolbox');

    backgrounds = require('application/client/sw/init/backgrounds').default;
  });

  after(() => {
    toolbox.mockTeardown();
    mocks.swUtilsIdbTreo.end();
    mocks.swToolbox.end();
    mocks.swData.end();
    delete global.Request;
    delete global.caches;
  });

  function runTest (response) {
    toolbox.mockSetup(response);

    // Run the module under test
    backgrounds(payload);
  }

  it('should add a single route to router', () => {
    runTest();

    expect(toolbox.router.routes.size).to.equal(1);
  });

  it('should handle all imageService requests', (done) => {
    const response = { test: 'yepper' };
    runTest(response);

    Promise.all(Object.keys(backgroundUrls).map(
      key => toolbox.mockFetch(backgroundUrls[key], 'GET')
    )).then((results) => {
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

  it('should prefetch requests not current', (done) => {
    const response = { test: 'yessir' };
    const keys = Object.keys(backgroundUrls);
    runTest(response);

    toolbox.mockFetch(backgroundUrls[keys[0]], 'GET')
      .then((res) => {
        expect(res).to.eql(response);
      })
      .then(() => {
        // keys[1] should have been cached as a side-effect.
        toolbox.uncache(backgroundUrls[keys[1]]).then((deleted) => {
          done(deleted ? null : new Error('notCurrent request was not cached'));
        });
      })
      .catch((error) => {
        done(error || mockFetchUnexpected);
      });
  });
});
