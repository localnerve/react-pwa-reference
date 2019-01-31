/***
 * Copyright (c) 2016 - 2019 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global Promise, after, afterEach, before, beforeEach, describe, it */

import { expect } from 'chai';
import mocks from 'test/mocks';

describe('sw/utils/customHelpers', () => {
  let toolbox, globalFetch, GlobalRequest, globalCacheStorage, treoMock;
  const requestUrl = 'someurl';
  const requestCacheUrl = requestUrl + '-cache';
  const unexpectedFlowError = new Error('Unexpected flow occurred');
  let customHelpers;

  before('sw/utils/customHelpers', function () {
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
    customHelpers =
      require('application/client/sw/node_modules/sw/utils/customHelpers');
  });

  after('sw/utils/customHelpers', () => {
    delete global.response;
    delete global.fetch;
    toolbox.mockTeardown();
    mocks.swUtilsIdbTreo.end();
    mocks.swToolbox.end();
    mocks.swData.end();
  });

  afterEach(() => {
    globalFetch.reset();
    globalFetch.setEmulateError(false);
    globalFetch.setMockResponse(undefined);
  });

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

  describe('fetchAndCache', () => {
    // Test run helper
    function runTest (options, method) {
      const reqs = createRequests(method);
      return customHelpers.fetchAndCache(reqs.reqNet, reqs.reqCache, options);
    }

    it('should handle fetch error as expected', (done) => {
      globalFetch.setEmulateError(true);

      runTest().then(() => {
        done(unexpectedFlowError);
      }).catch((error) => {
        expect(error).to.be.an.instanceof(Error);
        done();
      });
    });

    it('should handle fetch error response as expected', (done) => {
      let calledTest = 0;

      runTest({
        successResponses: {
          test: () => {
            calledTest++;
            return false;
          }
        }
      }).then(() => {
        done(unexpectedFlowError);
      }).catch((error) => {
        expect(calledTest).to.equal(1);
        expect(error).to.be.an.instanceof(global.Response);
        done();
      });
    });

    it('should call successHandler as specified, successHandler can reject', (done) => {
      let calledSuccessHandler = 0;

      runTest({
        successHandler: (reqNet, response, reqCache) => {
          expect(reqNet).to.be.an.instanceof(GlobalRequest);
          expect(reqNet.url).to.equal(requestUrl);
          expect(reqCache).to.be.an.instanceof(GlobalRequest);
          expect(reqCache.url).to.equal(requestCacheUrl);
          expect(response).to.be.an.instanceof(global.Response);
          calledSuccessHandler++;
          return Promise.reject(response);
        }
      }).then(() => {
        done(unexpectedFlowError);
      }).catch((error) => {
        expect(calledSuccessHandler).to.equal(1);
        expect(error).to.be.an.instanceof(global.Response);
        done();
      });
    });

    it('should allow successHandler to substitute a response', (done) => {
      let calledSuccessHandler = 0;
      const subResponse = new global.Response({
        some: 'super-special-sub-response'
      }, {
        status: 200
      });

      // Define post requests to avoid running cache code.
      runTest({
        successHandler: () => {
          calledSuccessHandler++;
          return Promise.resolve(subResponse);
        }
      }, 'POST').then((response) => {
        expect(calledSuccessHandler).to.equal(1);
        expect(response).to.eql(subResponse);
        done();
      }).catch((error) => {
        done(error || unexpectedFlowError);
      });
    });

    describe('CacheStorage', () => {
      beforeEach(() => {
        toolbox.mockSetup();
      });

      afterEach(() => {
        toolbox.mockTeardown();
        delete global.caches;
      });

      it('should fail caches.open as expected', (done) => {
        setupCacheStorage({ openFail: true });

        runTest().then(() => {
          done(unexpectedFlowError);
        }).catch((error) => {
          expect(error).to.be.an.instanceof(Error);
          done();
        });
      });

      it('should handle no previous response, call cacheHandler as specified' +
      ' AND cacheHandler can substitute response', (done) => {
        let calledCacheHandler = 0;
        const subResponse = new global.Response({
          some: 'ch-substituted-response-body'
        });

        setupCacheStorage({
          cache: {
            default: false
          }
        });

        runTest({
          cacheHandler: (cache, reqCache, prevResp, newResp) => {
            expect(cache).to.be.an.instanceof(globalCacheStorage.Cache);
            expect(reqCache).to.be.an.instanceof(GlobalRequest);
            expect(reqCache.url).to.equal(requestCacheUrl);
            expect(prevResp).to.be.undefined;
            expect(newResp).to.be.an.instanceof(global.Response);
            calledCacheHandler++;
            return Promise.resolve(subResponse);
          }
        }).then((response) => {
          expect(calledCacheHandler).to.equal(1);
          expect(response).to.eql(subResponse);
          done();
        }).catch((error) => {
          done(error || unexpectedFlowError);
        });
      });

      it('should get previous response and give to cacheHandler', (done) => {
        let calledCacheHandler = 0;
        const prevResponse = new global.Response({
          some: 'ch-previous-response'
        });

        const cacheNames = {};
        cacheNames[toolbox.options.cache.name] = new globalCacheStorage.Cache();
        cacheNames[toolbox.options.cache.name].put(requestCacheUrl, prevResponse);
        setupCacheStorage({
          cacheNames: cacheNames
        });

        runTest({
          cacheHandler: (cache, reqCache, prevResp, newResp) => {
            expect(cache).to.be.an.instanceof(globalCacheStorage.Cache);
            expect(reqCache).to.be.an.instanceof(GlobalRequest);
            expect(reqCache.url).to.equal(requestCacheUrl);
            expect(prevResp).to.eql(prevResponse);
            expect(newResp).to.be.an.instanceof(global.Response);
            calledCacheHandler++;
            return Promise.resolve(newResp);
          }
        }).then(() => {
          expect(calledCacheHandler).to.equal(1);
          done();
        }).catch((error) => {
          done(error || unexpectedFlowError);
        });
      });

      it('should store new response, no cacheHandler, no successHandler', (done) => {
        const newResponse = new global.Response({
          some: 'new-response'
        }, {
          status: 200
        });

        globalFetch.setMockResponse(newResponse);
        setupCacheStorage();

        runTest().then((response) => {
          expect(response).to.eql(newResponse);
          done();
        }).catch((error) => {
          done(error || unexpectedFlowError);
        });
      });
    });
  });

  describe('contentRace', () => {
    let calledPostMessage, getReqs, cacheResponse, cacheResponseIdentical,
      networkResponse;

    before('contentRace', () => {
      toolbox.mockSetup();
      global.clients = {
        matchAll: () => {
          return Promise.resolve([{
            url: {
              indexOf: () => {
                return 0;
              }
            },
            postMessage: () => {
              calledPostMessage++;
            }
          }]);
        }
      };
    });

    after('contentRace', () => {
      delete global.clients;
      toolbox.mockTeardown();
    });

    beforeEach('contentRace', () => {
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

      const cacheNames = {};
      cacheNames[toolbox.options.cache.name] = new globalCacheStorage.Cache();
      cacheNames[toolbox.options.cache.name].put(requestCacheUrl, cacheResponse);
      setupCacheStorage({
        cacheNames: cacheNames
      });

      globalFetch.setMockResponse(networkResponse);
    });

    afterEach('contentRace', () => {
      calledPostMessage = 0;
    });

    function testCacheAndNetwork (promise, options) {
      options = options || {};

      return promise
        .then((response) => {
          if (!options.ignoreCacheResponse) {
            expect(response).to.eql(cacheResponse);
          }
          return global.caches.open(toolbox.options.cache.name);
        })
        .then((cache) => {
          return cache.match(requestCacheUrl);
        })
        .then((response) => {
          if (!options.ignoreNetworkResponse) {
            expect(response).to.eql(networkResponse);
          }
        });
    }

    it('should respond from cache and update cache with new response', (done) => {
      testCacheAndNetwork(
        customHelpers.contentRace(getReqs.reqNet, getReqs.reqCache)
      )
        .then(() => {
          // Cache responded, but wait for network to completely resolve to
          // inspect side effects like postMessage.
          setTimeout(() => {
            // b/c the difference was greater than 1%
            expect(calledPostMessage).to.equal(1);
            done();
          }, 100);
        })
        .catch((error) => {
          done(error || unexpectedFlowError);
        });
    });

    it('should call updateHandler as specified', (done) => {
      let calledUpdateHandler = 0;

      testCacheAndNetwork(
        customHelpers.contentRace(getReqs.reqNet, getReqs.reqCache, (req, res) => {
          expect(req).to.be.an.instanceof(GlobalRequest);
          expect(req).to.eql(getReqs.reqCache);
          expect(res).to.be.an.instanceof(global.Response);
          expect(res).to.eql(networkResponse);
          calledUpdateHandler++;
        })
      )
        .then(() => {
          // wait to inspect side effect evidence
          setTimeout(() => {
            expect(calledPostMessage).to.equal(0);
            expect(calledUpdateHandler).to.equal(1);
            done();
          }, 100);
        })
        .catch((error) => {
          done(error || unexpectedFlowError);
        });
    });

    it('should not call updateHandler if no difference', (done) => {
      let calledUpdateHandler = 0;

      global.caches.open(toolbox.options.cache.name)
        .then((cache) => {
          // Make previously cached response identical to networkResponse.
          return cache.put(requestCacheUrl, cacheResponseIdentical);
        })
        .then(() => {
          return testCacheAndNetwork(
            customHelpers.contentRace(getReqs.reqNet, getReqs.reqCache, () => {
              calledUpdateHandler++;
            }), {
              ignoreCacheResponse: true
            }
          );
        })
        .then(() => {
          // wait to inspect side effect evidence
          setTimeout(() => {
            expect(calledUpdateHandler).to.equal(0);
            done();
          }, 100)
        })
        .catch((error) => {
          done(error || unexpectedFlowError);
        });
    });

    it('should handle no previous cached response, not call updateHandler', (done) => {
      let calledUpdateHandler = 0;

      global.caches.open(toolbox.options.cache.name)
        .then((cache) => {
          // Remove previously cached response.
          return cache.put(requestCacheUrl, undefined);
        })
        .then(() => {
          return testCacheAndNetwork(
            customHelpers.contentRace(getReqs.reqNet, getReqs.reqCache, () => {
              calledUpdateHandler++;
            }), {
              ignoreCacheResponse: true
            }
          );
        })
        .then(() => {
          // wait to inspect the side effect evidence
          setTimeout(() => {
            expect(calledUpdateHandler).to.equal(0);
            done();
          }, 100)
        })
        .catch((error) => {
          done(error || unexpectedFlowError);
        });
    });

    it('should handle both no cached response AND bad network response', (done) => {
      globalFetch.setMockResponse(new global.Response({
        body: 'bad'
      }, {
        status: 400
      }));

      global.caches.open(toolbox.options.cache.name)
        .then((cache) => {
          // Remove previously cached response.
          return cache.put(requestCacheUrl, undefined);
        })
        .then(() => {
          return testCacheAndNetwork(
            customHelpers.contentRace(getReqs.reqNet, getReqs.reqCache), {
              ignoreCacheResponse: true,
              ignoreNetworkResponse: true
            }
          );
        })
        .then(() => {
          done(unexpectedFlowError);
        })
        .catch(() => {
          done();
        });
    });
  });
});
