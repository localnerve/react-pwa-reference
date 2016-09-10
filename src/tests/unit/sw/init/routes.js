/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
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

    treoMock.setValue([]);

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
    calledPostMessage = 0;
  });

  function runTest (startup, response) {
    toolbox.mockSetup(response);

    // Run the module under test
    return routesModule(payload, startup);
  }

  describe('detectServerSideRender', () => {
    let saveClients;

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
      global.clients = {
        matchAll: () => {
          return Promise.resolve([{
            postMessage
          }]);
        }
      };
    }

    function checkFetchedUrls (param) {
      const urls = globalFetch.findUrls(
        Object.keys(payload.RouteStore.routes).map((route) => {
          return payload.RouteStore.routes[route].path;
        })
      );

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
  });

  describe('route behavior', () => {
    it('should install the given routes', (done) => {
      runTest()
        .then(() => {
          const methodMap = toolbox.router.routes.values().next().value;
          const getRouteMap = methodMap.get('get');
          const routeREs = getRouteMap.keys();

          expect(getRouteMap.size).to.equal(2);

          Object.keys(payload.RouteStore.routes).forEach((route) => {
            expect((new RegExp(routeREs.next().value)).test(
              payload.RouteStore.routes[route].path
            )).to.be.true;
          });

          done();
        })
        .catch((error) => {
          done(error || unexpectedFlowError);
        });
    });
  });

  describe('cache behavior', () => {
    afterEach(function () {
      delete global.caches;
    });

    function setupCacheStorage (options) {
      global.caches = globalCacheStorage.create(options);
    }

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

    it.skip('should not fetch the routes if recent, but install handlers',
    () => {
    });
  });
});
