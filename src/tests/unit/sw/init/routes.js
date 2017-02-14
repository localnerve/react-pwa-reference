/***
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global Promise, after, afterEach, before, beforeEach, describe, it */
import { expect } from 'chai';
import mocks from 'test/mocks';

describe('sw/init/routes', () => {
  let toolbox, treoMock, globalCacheStorage, globalFetch, routesModule,
    calledPostMessage;
  const unexpectedFlowError = new Error('unexpected flow error'),
    payload = {
      RouteStore: {
        routes: {
          one: {
            mainNav: true,
            path: '/one'
          },
          two: {
            mainNav: true,
            path: '/two'
          }
        }
      }
    };

  before('sw/init/routes', function () {
    this.timeout(5000);

    global.Request = require('test/mocks/request');
    global.Response = require('test/mocks/response');
    global.MessageChannel = require('test/mocks/messagechannel');
    global.location = {
      origin: 'http://localhost'
    };

    mocks.swData.begin();
    mocks.swToolbox.begin();
    mocks.swUtilsIdbTreo.begin();
    toolbox = require('sw-toolbox');
    treoMock = require('treo');

    globalFetch = require('test/mocks/sw-fetch');
    global.fetch = globalFetch.fetch;

    globalCacheStorage = require('test/mocks/sw-caches');

    global.clients = {
      matchAll: () => {
        return Promise.resolve([{
          postMessage: () => {
            calledPostMessage++;
          }
        }]);
      }
    };

    routesModule = require('application/client/sw/init/routes').default;
  });

  after(() => {
    delete global.clients;
    delete global.fetch;
    delete global.Request;
    delete global.Response;
    delete global.location;
    delete global.MessageChannel;
    mocks.swUtilsIdbTreo.end();
    toolbox.mockTeardown();
    mocks.swToolbox.end();
    mocks.swData.end();
  });

  beforeEach(() => {
    treoMock.setValue([]);
    calledPostMessage = 0;
  });

  afterEach(function () {
    delete global.caches;
  });

  function setupCacheStorage (options) {
    global.caches = globalCacheStorage.create(options);
  }

  function findFetchedTestUrls () {
    return globalFetch.findUrls(
      Object.keys(payload.RouteStore.routes).map((route) => {
        return payload.RouteStore.routes[route].path;
      })
    );
  }

  function checkInstalledTestUrls () {
    const methodMap = toolbox.router.routes.values().next().value;
    const getRouteMap = methodMap.get('get');
    const routeREs = getRouteMap.keys();

    expect(getRouteMap.size).to.equal(
      Object.keys(payload.RouteStore.routes).length
    );

    Object.keys(payload.RouteStore.routes).forEach((route) => {
      expect((new RegExp(routeREs.next().value)).test(
        payload.RouteStore.routes[route].path
      )).to.be.true;
    });
  }

  function runTest (startup, response) {
    toolbox.mockSetup(response);

    // Run the module under test
    return routesModule(payload, startup);
  }

  describe('detectServerSideRender', () => {
    let saveClients, cache;

    before(() => {
      saveClients = global.clients;
    });

    after(() => {
      global.clients = saveClients;
      globalFetch.reset();
    });

    beforeEach(() => {
      globalFetch.reset();
    });

    function prep (postMessage) {
      cache = new globalCacheStorage.Cache();
      setupCacheStorage({
        cacheNames: {
          [toolbox.options.cache.name]: cache
        }
      });

      global.clients = {
        matchAll: () => {
          return Promise.resolve([{
            postMessage
          }]);
        }
      };
    }

    function checkFetchedUrls (param) {
      const urls = findFetchedTestUrls();

      expect(urls.length).to.be.at.least(
        Object.keys(payload.RouteStore.routes).length
      );

      // Make sure each fetched url contains the param.
      urls.forEach((url) => {
        expect(url).to.contain(param);
      });
    }

    it('should skip SSR if not startup', (done) => {
      runTest(false)
        .then(() => {
          checkFetchedUrls('render=0');
          done();
        })
        .catch((error) => {
          done(error || unexpectedFlowError);
        });
    });

    it('should skip SSR if message response', (done) => {
      prep((payload) => {
        calledPostMessage++;
        payload.port.mockRespond({
          data: {
            message: 'pong'
          }
        });
      });

      runTest(true)
        .then(() => {
          expect(calledPostMessage).to.equal(1);
          checkFetchedUrls('render=0');
          done();
        })
        .catch((error) => {
          done(error || unexpectedFlowError);
        });
    });

    it('should request SSR if no message response', (done) => {
      prep(() => {
        calledPostMessage++;
      });

      runTest(true)
        .then(() => {
          expect(calledPostMessage).to.equal(1);
          checkFetchedUrls('render=1');
          done();
        })
        .catch((error) => {
          done(error || unexpectedFlowError);
        })
    });

    it('should remove non-SSR routes from cache if SSR', (done) => {
      const routes = payload.RouteStore.routes;

      treoMock.setValue(Object.keys(routes)
        .reduce((prev, curr) => {
          prev[routes[curr].path] = {};
          prev[routes[curr].path].timestamp = Date.now();
          prev[routes[curr].path].ssr = false;
          return prev;
        }, {}));

      prep(() => {
        calledPostMessage++;
      });

      runTest(true)
        .then(() => {
          const dbRoutes = treoMock.getValue();
          expect(Object.keys(dbRoutes).length).to.equal(2);
          // They should all have been flipped to true
          Object.keys(routes).forEach((route) => {
            expect(dbRoutes[routes[route].path].ssr).to.be.true;
          });
          expect(calledPostMessage).to.equal(1);
          checkFetchedUrls('render=1');
          done();
        })
        .catch((error) => {
          done(error || unexpectedFlowError);
        });
    });
  });

  describe('route behavior', () => {
    it('should install the given routes', (done) => {
      runTest()
        .then(() => {
          checkInstalledTestUrls();
          done();
        })
        .catch((error) => {
          done(error || unexpectedFlowError);
        });
    });
  });

  describe('cache behavior', () => {
    beforeEach(() => {
      globalFetch.reset();
    });

    it('should cache the given routes if not recent', (done) => {
      treoMock.setValue([]); // set not recent

      const cache = new globalCacheStorage.Cache();
      setupCacheStorage({
        cacheNames: {
          [toolbox.options.cache.name]: cache
        }
      });

      runTest()
        .then(() => {
          const routes = payload.RouteStore.routes;
          Promise.all(
            Object.keys(routes).map((route) => {
              return cache.match(routes[route].path);
            })
          )
            .then((results) => {
              expect(results.length).to.equal(Object.keys(routes).length);

              results.forEach((response) => {
                if (response) {
                  expect(response.status).to.equal(200);
                } else {
                  throw new Error('response was undefined');
                }
              });

              done();
            });
        })
        .catch((error) => {
          done(error || unexpectedFlowError);
        });
    });

    it('should not fetch routes if recent, but install handlers',
    (done) => {
      const routes = payload.RouteStore.routes;
      const dummyResponse = new global.Response({
        body: 'dummy'
      });

      // Set routes to "recent"
      treoMock.setValue(Object.keys(routes).reduce((prev, curr) => {
        prev[routes[curr].path] = {};
        prev[routes[curr].path].timestamp = Date.now();
        prev[routes[curr].path].ssr = false;
        return prev;
      }, {}));

      // For actual cache inspection (making sure it remains empty)
      const cache = new globalCacheStorage.Cache();
      setupCacheStorage({
        cacheNames: {
          [toolbox.options.cache.name]: cache
        }
      });

      // Set a dummy response for recent cache hit
      runTest(false, dummyResponse)
        .then(() => {
          // nothing cached
          expect(cache._size()).to.equal(0);
          // nothing fetched
          expect(findFetchedTestUrls().length).to.equal(0);
          // routes installed
          checkInstalledTestUrls();

          done();
        })
        .catch((error) => {
          done(error || unexpectedFlowError);
        });
    });
  });
});
