/***
 * Copyright (c) 2016 - 2021 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global Promise, after, afterEach, before, beforeEach, describe, it */

import { expect } from 'chai';
import mocks from 'test/mocks';

describe('sw/utils/customNetworkFirst', () => {
  let toolbox, globalFetch, GlobalRequest, globalCacheStorage, treoMock;
  const requestUrl = 'someurl';
  const requestCacheUrl = requestUrl + '-cache';
  const unexpectedFlowError = new Error('Unexpected flow occurred');
  let responses, requests;
  let customNetworkFirst;

  before('sw/utils/customNetworkFirst', function () {
    this.timeout(5000);

    mocks.swData.begin();
    mocks.swToolbox.begin();
    mocks.swUtilsIdbTreo.begin();

    treoMock = require('treo');
    treoMock.setValue(null);

    toolbox = require('sw-toolbox');
    toolbox.mockSetup();

    globalFetch = require('test/mocks/sw-fetch');
    global.fetch = globalFetch.fetch;

    globalCacheStorage = require('test/mocks/sw-caches');

    // so far, not used by module under test, so keep it here
    GlobalRequest = require('test/mocks/request');

    global.Response = require('test/mocks/response');

    // The module under test
    customNetworkFirst =
      require('application/client/sw/node_modules/sw/utils/customNetworkFirst');
  });

  after('sw/utils/customNetworkFirst', () => {
    delete global.response;
    delete global.fetch;
    toolbox.mockTeardown();
    mocks.swUtilsIdbTreo.end();
    mocks.swToolbox.end();
    mocks.swData.end();
  });

  beforeEach(() => {
    responses = createResponses();

    const cacheNames = {};
    cacheNames[toolbox.options.cache.name] = new globalCacheStorage.Cache();
    cacheNames[toolbox.options.cache.name].put(requestCacheUrl, responses.resCache);
    setupCacheStorage({
      cacheNames: cacheNames
    });

    globalFetch.setMockResponse(responses.resNet);
  });

  afterEach(() => {
    globalFetch.reset();
    globalFetch.setResponseDelay(0);
    globalFetch.setEmulateError(false);
    globalFetch.setMockResponse(undefined);
  });

  function createResponses () {
    return {
      resNet: new global.Response({
        some: 'network-first-network-response'
      }, { status: 200 }),
      resCache: new global.Response({
        some: 'network-first-cache-response'
      }, { status: 200 })
    };
  }

  function createRequests (method) {
    const reqOptions = {
      method: method || 'GET',
      body: {
        some: 'body'
      }
    };
    return {
      reqNet: new GlobalRequest(requestUrl, reqOptions),
      reqCache: new GlobalRequest(requestCacheUrl, reqOptions)
    };
  }

  function setupCacheStorage (options) {
    global.caches = globalCacheStorage.create(options);
  }

  // Test run helper
  function runTest (options, method) {
    options = options || {};

    requests = createRequests(method);

    const factoryOptions = options.factory || {};
    delete options.factory;

    function requestFactory (which) {
      if (factoryOptions.requestFail) {
        throw new Error('mock error');
      }
      return Promise.resolve(requests[which]);
    }

    const networkFirst = customNetworkFirst.routeHandlerFactory(
      requestFactory.bind(null, 'reqNet'), requestFactory.bind(null, 'reqCache'),
      factoryOptions.fallback
    );

    return networkFirst(null, null, options);
  }

  it('should handle request failures as expected', (done) => {
    runTest({
      factory: {
        requestFail: true
      }
    })
      .then(() => {
        done(unexpectedFlowError);
      })
      .catch((error) => {
        expect(error).to.be.an.instanceof(Error);
        done();
      });
  });

  describe('fallback', () => {
    // Setup fetch and cache failures to force fallback usage.
    beforeEach('fallback', (done) => {
      globalFetch.setEmulateError(true);

      global.caches.open(toolbox.options.cache.name)
        .then((cache) => {
          // Remove previously cached response.
          cache.put(requestCacheUrl, undefined);
          done();
        });
    });

    it('should return undefined response when no fallback', (done) => {
      runTest()
        .then((response) => {
          expect(response).to.be.undefined;
          done();
        })
        .catch((error) => {
          done(error || unexpectedFlowError);
        });
    });

    it('should fail when fallback fails', (done) => {
      let calledFallback = 0;

      runTest({
        factory: {
          fallback: (reqCache) => {
            expect(reqCache).to.eql(requests.reqCache);
            calledFallback++;
            return Promise.reject(new Error('mock error'));
          }
        }
      })
        .then(() => {
          done(unexpectedFlowError);
        })
        .catch((error) => {
          expect(calledFallback).to.equal(1);
          expect(error).to.be.an.instanceof(Error);
          done();
        });
    });

    it('should call fallback as specified when network and cache fails', (done) => {
      let calledFallback = 0;

      runTest({
        factory: {
          fallback: (reqCache) => {
            expect(reqCache).to.eql(requests.reqCache);
            calledFallback++;
            return Promise.resolve(responses.resCache);
          }
        }
      })
        .then((response) => {
          expect(response).to.eql(responses.resCache);
          expect(calledFallback).to.equal(1);
          done();
        })
        .catch((error) => {
          done(error || unexpectedFlowError);
        });
    });
  });

  describe('nominal network first', () => {
    it('should resolve to a network response first', (done) => {
      runTest()
        .then((response) => {
          expect(response).to.eql(responses.resNet);
          done();
        })
        .catch((error) => {
          done(error || unexpectedFlowError);
        });
    });

    it('should resolve to a cache response on network failure', (done) => {
      globalFetch.setEmulateError(true);

      runTest()
        .then((response) => {
          expect(response).to.eql(responses.resCache);
          done();
        })
        .catch((error) => {
          done(error || unexpectedFlowError);
        });
    });
  });

  describe('timeout', () => {
    it('should respond from cache if timeout before fetch', (done) => {
      globalFetch.setResponseDelay(200);

      runTest({
        networkTimeout: 100
      })
        .then((response) => {
          expect(response).to.eql(responses.resCache);
          setTimeout(done, 200);
        })
        .catch((error) => {
          setTimeout(done, 200, error || unexpectedFlowError);
        });
    });

    it('should respond from fallback if no cache and timeout before fetch', (done) => {
      let calledFallback = 0;

      globalFetch.setResponseDelay(200);

      global.caches.open(toolbox.options.cache.name)
        .then((cache) => {
          // Remove previously cached response.
          return cache.put(requestCacheUrl, undefined);
        })
        .then(() => {
          return runTest({
            factory: {
              fallback: () => {
                calledFallback++;
                return Promise.resolve(responses.resCache);
              }
            },
            networkTimeout: 100
          });
        })
        .then((response) => {
          expect(calledFallback).to.equal(1);
          expect(response).to.eql(responses.resCache);
          setTimeout(done, 200);
        })
        .catch((error) => {
          setTimeout(done, 200, error || unexpectedFlowError);
        });
    });

    it('should respond from network if before timeout', (done) => {
      globalFetch.setResponseDelay(50);

      runTest({
        networkTimeout: 100
      })
        .then((response) => {
          expect(response).to.eql(responses.resNet);
          setTimeout(done, 50);
        })
        .catch((error) => {
          setTimeout(done, 100, error || unexpectedFlowError);
        });
    });

    it('should respond from cache if fetch fails and also clearTimeout', (done) => {
      globalFetch.setEmulateError(true);

      runTest({
        networkTimeout: 100
      })
        .then((response) => {
          expect(response).to.eql(responses.resCache);
          done();
        })
        .catch((error) => {
          setTimeout(done, 100, error || unexpectedFlowError);
        });
    });

    it('should still respond from network if timeout and no cache', (done) => {
      globalFetch.setResponseDelay(100);

      global.caches.open(toolbox.options.cache.name)
        .then((cache) => {
          // Remove previously cached response.
          return cache.put(requestCacheUrl, undefined);
        })
        .then(() => {
          return runTest({
            networkTimeout: 50
          });
        })
        .then((response) => {
          expect(response).to.eql(responses.resNet);
          done();
        })
        .catch((error) => {
          setTimeout(done, 100, error || unexpectedFlowError);
        });
    });
  });
});
