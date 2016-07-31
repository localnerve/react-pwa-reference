/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global Promise, after, afterEach, before, beforeEach, describe, it */
'use strict';

var expect = require('chai').expect;
var mocks = require('test/mocks');

describe('sw/utils/customNetworkFirst', function () {
  var toolbox, globalFetch, GlobalRequest, globalCacheStorage;
  var requestUrl = 'someurl', requestCacheUrl = requestUrl + '-cache';
  var unexpectedFlowError = new Error('Unexpected flow occurred');
  var responses, requests;
  var customNetworkFirst;

  before('sw/utils/customNetworkFirst', function () {
    this.timeout(5000);

    mocks.swData.begin();
    mocks.swToolbox.begin();

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

  after('sw/utils/customNetworkFirst', function () {
    delete global.response;
    delete global.fetch;
    toolbox.mockTeardown();
    mocks.swToolbox.end();
    mocks.swData.end();
  });

  beforeEach(function () {
    responses = createResponses();

    var cacheNames = {};
    cacheNames[toolbox.options.cache.name] = new globalCacheStorage.Cache();
    cacheNames[toolbox.options.cache.name].put(requestCacheUrl, responses.resCache);
    setupCacheStorage({
      cacheNames: cacheNames
    });

    globalFetch.setMockResponse(responses.resNet);
  });

  afterEach(function () {
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
    var reqOptions = {
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

    var factoryOptions = options.factory || {};
    delete options.factory;

    function requestFactory (which) {
      if (factoryOptions.requestFail) {
        throw new Error('mock error');
      }
      return Promise.resolve(requests[which]);
    }

    var networkFirst = customNetworkFirst.routeHandlerFactory(
      requestFactory.bind(null, 'reqNet'), requestFactory.bind(null, 'reqCache'),
      factoryOptions.fallback
    );

    return networkFirst(null, null, options);
  }

  it('should handle request failures as expected', function (done) {
    runTest({
      factory: {
        requestFail: true
      }
    })
      .then(function () {
        done(unexpectedFlowError);
      })
      .catch(function (error) {
        expect(error).to.be.an.instanceof(Error);
        done();
      });
  });

  describe('fallback', function () {
    // Setup fetch and cache failures to force fallback usage.
    beforeEach('fallback', function (done) {
      globalFetch.setEmulateError(true);

      global.caches.open(toolbox.options.cache.name)
        .then(function (cache) {
          // Remove previously cached response.
          cache.put(requestCacheUrl, undefined);
          done();
        });
    });

    it('should return undefined response when no fallback', function (done) {
      runTest()
        .then(function (response) {
          expect(response).to.be.undefined;
          done();
        })
        .catch(function (error) {
          done(error || unexpectedFlowError);
        });
    });

    it('should fail when fallback fails', function (done) {
      var calledFallback = 0;

      runTest({
        factory: {
          fallback: function (reqCache) {
            expect(reqCache).to.eql(requests.reqCache);
            calledFallback++;
            return Promise.reject(new Error('mock error'));
          }
        }
      })
        .then(function () {
          done(unexpectedFlowError);
        })
        .catch(function (error) {
          expect(calledFallback).to.equal(1);
          expect(error).to.be.an.instanceof(Error);
          done();
        });
    });

    it('should call fallback as specified when network and cache fails',
    function (done) {
      var calledFallback = 0;

      runTest({
        factory: {
          fallback: function (reqCache) {
            expect(reqCache).to.eql(requests.reqCache);
            calledFallback++;
            return Promise.resolve(responses.resCache);
          }
        }
      })
        .then(function (response) {
          expect(response).to.eql(responses.resCache);
          expect(calledFallback).to.equal(1);
          done();
        })
        .catch(function (error) {
          done(error || unexpectedFlowError);
        });
    });
  });

  describe('nominal network first', function () {
    it('should resolve to a network response first', function (done) {
      runTest()
        .then(function (response) {
          expect(response).to.eql(responses.resNet);
          done();
        })
        .catch(function (error) {
          done(error || unexpectedFlowError);
        });
    });

    it('should resolve to a cache response on network failure', function (done) {
      globalFetch.setEmulateError(true);

      runTest()
        .then(function (response) {
          expect(response).to.eql(responses.resCache);
          done();
        })
        .catch(function (error) {
          done(error || unexpectedFlowError);
        });
    });
  });

  describe('timeout', function () {
    it('should respond from cache if timeout before fetch', function (done) {
      globalFetch.setResponseDelay(200);

      runTest({
        networkTimeout: 100
      })
        .then(function (response) {
          expect(response).to.eql(responses.resCache);
          setTimeout(done, 100);
        })
        .catch(function (error) {
          setTimeout(done, 200, error || unexpectedFlowError);
        });
    });

    it('should respond from fallback if no cache and timeout before fetch',
    function (done) {
      var calledFallback = 0;

      globalFetch.setResponseDelay(200);

      global.caches.open(toolbox.options.cache.name)
        .then(function (cache) {
          // Remove previously cached response.
          return cache.put(requestCacheUrl, undefined);
        })
        .then(function () {
          return runTest({
            factory: {
              fallback: function () {
                calledFallback++;
                return Promise.resolve(responses.resCache);
              }
            },
            networkTimeout: 100
          });
        })
        .then(function (response) {
          expect(calledFallback).to.equal(1);
          expect(response).to.eql(responses.resCache);
          setTimeout(done, 100);
        })
        .catch(function (error) {
          setTimeout(done, 200, error || unexpectedFlowError);
        });
    });

    it('should respond from network if before timeout', function (done) {
      globalFetch.setResponseDelay(50);

      runTest({
        networkTimeout: 100
      })
        .then(function (response) {
          expect(response).to.eql(responses.resNet);
          setTimeout(done, 50);
        })
        .catch(function (error) {
          setTimeout(done, 100, error || unexpectedFlowError);
        });
    });

    it('should respond from cache if fetch fails and also clearTimeout',
    function (done) {
      globalFetch.setEmulateError(true);

      runTest({
        networkTimeout: 100
      })
        .then(function (response) {
          expect(response).to.eql(responses.resCache);
          done();
        })
        .catch(function (error) {
          setTimeout(done, 100, error || unexpectedFlowError);
        });
    });

    it('should still respond from network if timeout and no cache',
    function (done) {
      globalFetch.setResponseDelay(100);

      global.caches.open(toolbox.options.cache.name)
        .then(function (cache) {
          // Remove previously cached response.
          return cache.put(requestCacheUrl, undefined);
        })
        .then(function () {
          return runTest({
            networkTimeout: 50
          });
        })
        .then(function (response) {
          expect(response).to.eql(responses.resNet);
          done();
        })
        .catch(function (error) {
          setTimeout(done, 100, error || unexpectedFlowError);
        });
    });
  });
});
