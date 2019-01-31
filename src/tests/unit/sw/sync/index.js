/**
 * Copyright (c) 2016 - 2019 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global after, afterEach, before, beforeEach, describe, it, Promise */
'use strict';

var expect = require('chai').expect;
var mocks = require('test/mocks');
var Self = require('test/mocks/self');
var syncable = require('utils/syncable');
var apiHelpers =
  require('application/client/sw/node_modules/sw/utils/api');

describe('sw/sync/index', function () {
  var index, treoMock, toolboxMock, fetchMock;
  var self = new Self();
  var unexpectedError = new Error('unexpected error');
  var requestReplayable, requestNonReplayable,
    url = 'http://someurl', apiPath = '/api';

  before('sw/sync/index setup', function () {
    this.timeout(5000);

    mocks.swData.begin();
    mocks.swSyncIndex.begin();
    self.setup();

    // setup for fetchMock is local to suites below
    fetchMock = require('test/mocks/sw-fetch');
    treoMock = require('treo');
    toolboxMock = require('sw-toolbox');

    toolboxMock.mockSetup();
    treoMock.setValue(null);

    global.Request = require('test/mocks/request');
    global.Blob = require('test/mocks/blob');

    index = require('application/client/sw/sync');
  });

  after('sw/sync/index teardown', function () {
    delete global.Blob;
    delete global.Request;

    toolboxMock.mockTeardown();
    self.teardown();
    mocks.swSyncIndex.end();
    mocks.swData.end();
  });

  beforeEach(function () {
    var nonReplayable = syncable.push({
      some: 'body'
    }, '123456789', syncable.ops.updateTopics);

    // mock a js body with a _fallback property.
    var userReplayable = syncable.contact({
      some: 'body'
    }, 'test@email');

    requestReplayable = new global.Request(url, {
      credentials: 'notgood',
      body: userReplayable
    });

    requestNonReplayable = new global.Request(url, {
      credentials: 'notgood',
      body: nonReplayable
    });
  });

  describe('removeFallback', function () {
    it('should remove fallback property', function (done) {
      index.removeFallback({}, requestReplayable)
        .then(function (req) {
          return req.json();
        })
        .then(function (body) {
          expect(body[syncable.propertyName]).to.be.undefined;
          done();
        });
    });

    it('should include options', function (done) {
      var credInclude = 'include';

      index.removeFallback({
        credentials: credInclude
      }, requestReplayable).then(function (req) {
        expect(req.credentials).to.equal(credInclude);
        done();
      });
    });
  });

  describe('maintainRequests', function () {
    beforeEach(function () {
      treoMock.setValue([]);
    });

    it('should pass through the given response', function (done) {
      var response = {
        test: 'response'
      };

      index.maintainRequests({}, response, requestReplayable)
        .then(function (result) {
          expect(result).to.eql(response);
          done();
        });
    });
  });

  describe('deferRequest', function () {
    var self = new Self(), reporterCalled;

    before('deferRequest setup', function () {
      global.Response = require('test/mocks/response');
      self.setup();
    });

    after('deferRequest teardown', function () {
      delete global.Response;
      self.teardown();
    });

    beforeEach(function () {
      reporterCalled = false;
      treoMock.setReporter(function (method) {
        reporterCalled = true;
        expect(method).to.equal('put');
      });
    });

    afterEach(function () {
      expect(reporterCalled).to.be.true;
    });

    it('should return a deferred response', function (done) {
      index.deferRequest(apiPath, requestNonReplayable)
        .then(function (response) {
          expect(response.statusText).to.equal('deferred');
          done();
        });
    });

    it('should return a failed response', function (done) {
      index.deferRequest(apiPath, requestReplayable)
        .then(function (response) {
          expect(response.statusText).to.equal('failed');
          done();
        });
    });

    describe('sync.register', function () {
      var calledSyncRegister;

      before(function () {
        self.setup({
          syncRegisterFn: function () {
            calledSyncRegister++;
            return Promise.resolve();
          }
        });
      });

      after(function () {
        self.setup();
      });

      beforeEach(function () {
        calledSyncRegister = 0;
      });

      function testSyncRegister (request, done) {
        index.deferRequest(apiPath, request)
          .then(function (response) {
            expect(response.statusText).to.equal('deferred');
            expect(calledSyncRegister).to.equal(1);
            done();
          })
          .catch(function (err) {
            done(err || unexpectedError);
          });
      }

      it('should register for replayable request', function (done) {
        testSyncRegister(requestReplayable, done);
      });

      it('should register for nonReplayable request', function (done) {
        testSyncRegister(requestNonReplayable, done);
      });
    });
  });

  describe('serviceAllRequests', function () {
    var mockApis = {}, calledDel, calledPut;

    before('serviceAllRequests setup', function () {
      global.Response = require('test/mocks/response');
      global.fetch = fetchMock.fetch;
    });

    after('serviceAllRequests teardown', function () {
      delete global.fetch;
      delete global.Response;
    });

    beforeEach(function (done) {
      mockApis[apiPath] = {
        xhrContext: {}
      };

      fetchMock.reset();

      // Called repeatedly from serviceAllRequests when underlying
      // treo layer is called.
      treoMock.setReporter(function (method, key, dehydratedRequest) {
        if (method === 'del') {
          calledDel++;
        }

        if (method === 'put' && key === dehydratedRequest.timestamp) {
          calledPut++;
          treoMock.setValue([
            dehydratedRequest
          ]);
        }
      });

      // Create a dehydratedRequest, store with reporter.
      index.deferRequest(apiPath, requestReplayable).then(function () {
        calledDel = calledPut = 0;
        done();
      }).catch(function (err) {
        done(err || unexpectedError);
      });
    });

    afterEach(function () {
      treoMock.setValue(undefined);
      treoMock.setReporter(undefined);
    });

    it('should read requests, fetch, and maintain storage', function (done) {
      index.serviceAllRequests(mockApis).then(function () {
        expect(calledDel).to.equal(1);
        done();
      }).catch(function (err) {
        done(err || unexpectedError);
      });
    });

    it('should throw when no api found failure', function (done) {
      delete mockApis[apiPath];

      index.serviceAllRequests(mockApis).catch(function (error) {
        expect(error.toString().toLowerCase()).to.be.a('string')
          .that.contains('api');
        done();
      });
    });

    it('should handle fetch failure', function (done) {
      var reporter = treoMock.getReporter();
      treoMock.setReporter(function (method, key, dehydratedRequest) {
        if (method === 'put') {
          calledPut++;
          expect(dehydratedRequest.failureCount).to.equal(1);
        } else {
          reporter(method, key, dehydratedRequest);
        }
      });

      fetchMock.setEmulateError(true);

      index.serviceAllRequests(mockApis).then(function () {
        expect(calledPut).to.equal(1);
        done();
      }).catch(function (err) {
        done(err || unexpectedError);
      });
    });

    it('should handle bad response', function (done) {
      var calledTest = false, reporter = treoMock.getReporter();

      treoMock.setReporter(function (method, key, dehydratedRequest) {
        if (method === 'put') {
          calledPut++;
          expect(dehydratedRequest.failureCount).to.equal(1);
        } else {
          reporter(method, key, dehydratedRequest);
        }
      });

      index.serviceAllRequests(mockApis, {
        successResponses: {
          test: function () {
            calledTest = true;
            return false;
          }
        }
      }).then(function () {
        expect(calledPut).to.equal(1);
        expect(calledTest).to.be.true;
        done();
      }).catch(function (err) {
        done(err || unexpectedError);
      });
    });

    it('should handle max failures', function (done) {
      // Set failureCount beyond limit
      treoMock.getValue()[0].failureCount = index.MAX_FAILURES;

      fetchMock.setEmulateError(true);

      index.serviceAllRequests(mockApis).then(function (results) {
        expect(calledDel).to.equal(1);
        expect(results[0].failureCount).to.be.at.least(3);
        done();
      }).catch(function (err) {
        done(err || unexpectedError);
      });
    });
  });

  describe('sync event', function () {
    var calledDel, testTag;

    before('sync event', function () {
      global.Response = require('test/mocks/response');
      global.fetch = fetchMock.fetch;
    });

    after('sync event', function () {
      delete global.fetch;
      delete global.Response;
    });

    beforeEach(function (done) {
      var mockApis = {};

      testTag = [
        index._ops.deferredRequests,
        apiPath
      ].join(index._ops.delimiter);

      mockApis[apiPath] = {
        xhrContext: {}
      };

      fetchMock.reset();

      treoMock.setValue(undefined);
      treoMock.setReporter(function (method, key, dehydratedRequest) {
        if (method === 'put' && key === dehydratedRequest.timestamp) {
          treoMock.setValue([
            dehydratedRequest
          ]);
        } else if (method === 'del') {
          calledDel++;
        }
      });

      index.deferRequest(apiPath, requestReplayable).then(function () {
        calledDel = 0;
        done();
      }).catch(function (error) {
        done(error || unexpectedError);
      });
    });

    function setupSuccessfulFirstFetch () {
      var body = {};
      body[apiHelpers.CSRFTokenPropertyName] = 'ABCD1234';

      fetchMock.setMockResponse(new global.Response(body, {
        status: 200
      }));
    }

    function createSyncEvent (success, failure) {
      return {
        tag: testTag,
        waitUntil: function (promise) {
          promise
            .then(success)
            .catch(failure);
        }
      };
    }

    it('should fail if bad event detail', function (done) {
      testTag = index._ops.deferredRequests;

      self.events.sync(createSyncEvent(
        function () {
          done(unexpectedError);
        },
        function (error) {
          expect(error.toString().toLowerCase()).contains('apipath');
          done();
        }
      ));
    });

    it('should fail if first fetch error', function (done) {
      fetchMock.setEmulateError(true);
      self.events.sync(createSyncEvent(
        function () {
          done(unexpectedError);
        },
        function () {
          done();
        }
      ));
    });

    it('should fail if first fetch bad response', function (done) {
      fetchMock.setMockResponse(new global.Response(null, {
        status: 500
      }));
      self.events.sync(createSyncEvent(
        function () {
          done(unexpectedError);
        },
        function () {
          done();
        }
      ));
    });

    it('should fail if no csrf token found in response text', function (done) {
      // no token exists in first default response
      self.events.sync(createSyncEvent(
        function () {
          done(unexpectedError);
        },
        function (error) {
          expect(error.toString().toLowerCase()).to.be.a('string')
            .that.contains('csrf');
          done();
        }
      ));
    });

    it('should fail if second fetch error', function (done) {
      setupSuccessfulFirstFetch();
      fetchMock.setEmulateError(true, 1);

      self.events.sync(createSyncEvent(
        function () {
          done(unexpectedError);
        },
        function () {
          done();
        }
      ));
    });

    it('should fail if second fetch bad response', function (done) {
      setupSuccessfulFirstFetch();
      fetchMock.setMockResponse(new global.Response(null, {
        status: 500
      }), 1);

      self.events.sync(createSyncEvent(
        function () {
          done(unexpectedError);
        },
        function () {
          done();
        }
      ));
    });

    it('should succeed if everything just right', function (done) {
      setupSuccessfulFirstFetch();
      fetchMock.setMockResponse(new global.Response(null, {
        status: 200
      }), 1);

      self.events.sync(createSyncEvent(
        function () {
          expect(calledDel).to.equal(1);
          done();
        },
        function (error) {
          done(error || unexpectedError);
        }
      ));
    });
  });
});
