/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global Promise, after, afterEach, before, beforeEach, describe, it */
'use strict';

var expect = require('chai').expect;
var mocks = require('../../../mocks');

describe('sw/utils/customHelpers', function () {
  var toolbox, globalFetch, GlobalRequest, globalCacheStorage;
  var requestUrl = 'someurl', requestCacheUrl = requestUrl + '-cache';
  var unexpectedFlowError = new Error('Unexpected flow occurred');
  var customHelpers;

  before('sw/utils/customHelpers', function () {
    this.timeout(5000);

    mocks.swToolbox.begin();

    toolbox = require('sw-toolbox');
    toolbox.mockSetup();

    globalFetch = require('../../../mocks/sw-fetch');
    global.fetch = globalFetch.fetch;

    globalCacheStorage = require('../../../mocks/sw-caches');

    // so far, not used by module under test, so keep it here
    GlobalRequest = require('../../../mocks/request');

    global.Response = require('../../../mocks/response');

    // The module under test
    customHelpers = require('../../../../assets/scripts/sw/utils/customHelpers');
  });

  after('sw/utils/customHelpers', function () {
    delete global.response;
    delete global.fetch;
    toolbox.mockTeardown();
    mocks.swToolbox.end();
  });

  afterEach(function () {
    globalFetch.setEmulateError(false);
    globalFetch.setMockResponse(undefined);
  });

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

  describe('fetchAndCache', function () {
    // Test run helper
    function runTest (options, method) {
      var reqs = createRequests(method);
      return customHelpers.fetchAndCache(reqs.reqNet, reqs.reqCache, options);
    }

    it('should handle fetch error as expected', function (done) {
      globalFetch.setEmulateError(true);

      runTest().then(function () {
        done(unexpectedFlowError);
      }).catch(function (error) {
        expect(error).to.be.an.instanceof(Error);
        done();
      });
    });

    it('should handle fetch error response as expected', function (done) {
      var calledTest = 0;

      runTest({
        successResponses: {
          test: function () {
            calledTest++;
            return false;
          }
        }
      }).then(function () {
        done(unexpectedFlowError);
      }).catch(function (error) {
        expect(calledTest).to.equal(1);
        expect(error).to.be.an.instanceof(global.Response);
        done();
      });
    });

    it('should call successHandler as specified, successHandler can reject',
    function (done) {
      var calledSuccessHandler = 0;

      runTest({
        successHandler: function (reqNet, response, reqCache) {
          expect(reqNet).to.be.an.instanceof(GlobalRequest);
          expect(reqNet.url).to.equal(requestUrl);
          expect(reqCache).to.be.an.instanceof(GlobalRequest);
          expect(reqCache.url).to.equal(requestCacheUrl);
          expect(response).to.be.an.instanceof(global.Response);
          calledSuccessHandler++;
          return Promise.reject(response);
        }
      }).then(function () {
        done(unexpectedFlowError);
      }).catch(function (error) {
        expect(calledSuccessHandler).to.equal(1);
        expect(error).to.be.an.instanceof(global.Response);
        done();
      });
    });

    it('should allow successHandler to substitute a response', function (done) {
      var calledSuccessHandler = 0;
      var subResponse = new global.Response({
        some: 'super-special-sub-response'
      }, {
        status: 200
      });

      // Define post requests to avoid running cache code.
      runTest({
        successHandler: function () {
          calledSuccessHandler++;
          return Promise.resolve(subResponse);
        }
      }, 'POST').then(function (response) {
        expect(response).to.eql(subResponse);
        done();
      }).catch(function (error) {
        done(error || unexpectedFlowError);
      });
    });

    describe('CacheStorage', function () {
      beforeEach(function () {
        toolbox.mockSetup();
      });

      afterEach(function () {
        toolbox.mockTeardown();
        delete global.caches;
      });

      it('should fail caches.open as expected', function (done) {
        setupCacheStorage({ openFail: true });

        runTest().then(function () {
          done(unexpectedFlowError);
        }).catch(function (error) {
          expect(error).to.be.an.instanceof(Error);
          done();
        });
      });

      it('should handle no previous response, call cacheHandler as specified' +
      ' AND cacheHandler can substitute response', function (done) {
        var calledCacheHandler = 0;
        var subResponse = new global.Response({
          some: 'ch-substituted-response-body'
        });

        setupCacheStorage({
          cache: {
            default: false
          }
        });

        runTest({
          cacheHandler: function (cache, reqCache, prevResp, newResp) {
            expect(cache).to.be.an.instanceof(globalCacheStorage.Cache);
            expect(reqCache).to.be.an.instanceof(GlobalRequest);
            expect(reqCache.url).to.equal(requestCacheUrl);
            expect(prevResp).to.be.undefined;
            expect(newResp).to.be.an.instanceof(global.Response);
            calledCacheHandler++;
            return Promise.resolve(subResponse);
          }
        }).then(function (response) {
          expect(calledCacheHandler).to.equal(1);
          expect(response).to.eql(subResponse);
          done();
        }).catch(function (error) {
          done(error || unexpectedFlowError);
        });
      });

      it('should get previous response and give to cacheHandler',
      function (done) {
        var calledCacheHandler = 0;
        var prevResponse = new global.Response({
          some: 'ch-previous-response'
        });

        var cacheNames = {};
        cacheNames[toolbox.options.cache.name] = new globalCacheStorage.Cache();
        cacheNames[toolbox.options.cache.name].put(requestCacheUrl, prevResponse);
        setupCacheStorage({
          cacheNames: cacheNames
        });


        runTest({
          cacheHandler: function (cache, reqCache, prevResp, newResp) {
            expect(cache).to.be.an.instanceof(globalCacheStorage.Cache);
            expect(reqCache).to.be.an.instanceof(GlobalRequest);
            expect(reqCache.url).to.equal(requestCacheUrl);
            expect(prevResp).to.eql(prevResponse);
            expect(newResp).to.be.an.instanceof(global.Response);
            calledCacheHandler++;
            return Promise.resolve(newResp);
          }
        }).then(function () {
          expect(calledCacheHandler).to.equal(1);
          done();
        }).catch(function (error) {
          done(error || unexpectedFlowError);
        });
      });

      it('should store new response, no cacheHandler, no successHandler',
      function (done) {
        var newResponse = new global.Response({
          some: 'new-response'
        }, {
          status: 200
        });

        globalFetch.setMockResponse(newResponse);
        setupCacheStorage();

        runTest().then(function (response) {
          expect(response).to.eql(newResponse);
          done();
        }).catch(function (error) {
          done(error || unexpectedFlowError);
        });
      });
    });
  });

  describe('contentRace', function () {
    var calledPostMessage, getReqs, cacheResponse, cacheResponseIdentical,
      networkResponse;

    before('contentRace', function () {
      toolbox.mockSetup();
      global.clients = {
        matchAll: function () {
          return Promise.resolve([{
            url: {
              indexOf: function () {
                return 0;
              }
            },
            postMessage: function () {
              calledPostMessage++;
            }
          }]);
        }
      };
    });

    after('contentRace', function () {
      delete global.clients;
      toolbox.mockTeardown();
    });

    beforeEach('contentRace', function () {
      calledPostMessage = 0;
      getReqs = createRequests('GET');

      // NOTE: there must be more than 1% difference in these responses.
      networkResponse = new global.Response({
        some: 'contact-race-network-response'
      }, { status: 200 });
      cacheResponse = new global.Response({
        some: 'content-race-cache-response'
      }, { status: 200 });

      cacheResponseIdentical = networkResponse.clone();

      var cacheNames = {};
      cacheNames[toolbox.options.cache.name] = new globalCacheStorage.Cache();
      cacheNames[toolbox.options.cache.name].put(requestCacheUrl, cacheResponse);
      setupCacheStorage({
        cacheNames: cacheNames
      });

      globalFetch.setMockResponse(networkResponse);
    });

    afterEach('contentRace', function () {
      calledPostMessage = 0;
    });

    function testCacheAndNetwork (promise, options) {
      options = options || {};

      return promise
      .then(function (response) {
        if (!options.ignoreCacheResponse) {
          expect(response).to.eql(cacheResponse);
        }
        return global.caches.open(toolbox.options.cache.name);
      })
      .then(function (cache) {
        return cache.match(requestCacheUrl);
      })
      .then(function (response) {
        if (!options.ignoreNetworkResponse) {
          expect(response).to.eql(networkResponse);
        }
      });
    }

    it('should respond from cache and update cache with new response',
    function (done) {
      testCacheAndNetwork(
        customHelpers.contentRace(getReqs.reqNet, getReqs.reqCache)
      )
      .then(function () {
        // b/c the difference was greater than 1%
        expect(calledPostMessage).to.equal(1);
        done();
      })
      .catch(function (error) {
        done(error || unexpectedFlowError);
      });
    });

    it('should call updateHandler as specified', function (done) {
      var calledUpdateHandler = 0;

      testCacheAndNetwork(
        customHelpers.contentRace(getReqs.reqNet, getReqs.reqCache,
        function (req, res) {
          expect(req).to.be.an.instanceof(GlobalRequest);
          expect(req).to.eql(getReqs.reqCache);
          expect(res).to.be.an.instanceof(global.Response);
          expect(res).to.eql(networkResponse);
          calledUpdateHandler++;
        })
      )
      .then(function () {
        expect(calledPostMessage).to.equal(0);
        expect(calledUpdateHandler).to.equal(1);
        done();
      })
      .catch(function (error) {
        done(error || unexpectedFlowError);
      });
    });

    it('should not call updateHandler if no difference', function (done) {
      var calledUpdateHandler = 0;

      global.caches.open(toolbox.options.cache.name)
      .then(function (cache) {
        // Make previously cached response identical to networkResponse.
        return cache.put(requestCacheUrl, cacheResponseIdentical);
      })
      .then(function () {
        return testCacheAndNetwork(
          customHelpers.contentRace(getReqs.reqNet, getReqs.reqCache,
          function () {
            calledUpdateHandler++;
          }), {
            ignoreCacheResponse: true
          }
        );
      })
      .then(function () {
        expect(calledUpdateHandler).to.equal(0);
        done();
      })
      .catch(function (error) {
        done(error || unexpectedFlowError);
      });
    });

    it('should handle no previous cached response, not call updateHandler',
    function (done) {
      var calledUpdateHandler = 0;

      global.caches.open(toolbox.options.cache.name)
      .then(function (cache) {
        // Remove previously cached response.
        return cache.put(requestCacheUrl, undefined);
      })
      .then(function () {
        return testCacheAndNetwork(
          customHelpers.contentRace(getReqs.reqNet, getReqs.reqCache,
          function () {
            calledUpdateHandler++;
          }), {
            ignoreCacheResponse: true
          }
        );
      })
      .then(function () {
        expect(calledUpdateHandler).to.equal(0);
        done();
      })
      .catch(function (error) {
        done(error || unexpectedFlowError);
      });
    });

    it('should handle both no cached response AND bad network response',
    function (done) {
      globalFetch.setMockResponse(new global.Response({
        body: 'bad'
      }, {
        status: 400
      }));

      global.caches.open(toolbox.options.cache.name)
      .then(function (cache) {
        // Remove previously cached response.
        return cache.put(requestCacheUrl, undefined);
      })
      .then(function () {
        return testCacheAndNetwork(
          customHelpers.contentRace(getReqs.reqNet, getReqs.reqCache), {
            ignoreCacheResponse: true,
            ignoreNetworkResponse: true
          }
        );
      })
      .then(function () {
        done(unexpectedFlowError);
      })
      .catch(function () {
        done();
      });
    });
  });
});
