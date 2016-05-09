/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global Promise, after, before, beforeEach, describe, it */
'use strict';

var expect = require('chai').expect;
var _ = require('lodash');
var syncable = require('utils/syncable');
var mocks = require('test/mocks');
var Self = require('test/mocks/self');

describe('sw/sync/serviceable', function () {
  var index, treoMock, toolboxMock, self,
    subscriptionId = '123456789',
    unexpectedFlowError = new Error('unexpected flow');

  var serviceable;
  var dehydratedRequests;

  before('sw/sync/serviceable setup', function () {
    this.timeout(5000);

    mocks.swData.begin();
    mocks.swSyncIndex.begin();

    self = new Self();
    self.setup({
      pushManager: {
        subReject: false,
        subscribed: true
      }
    });

    index = require('application/client/sw/sync');
    treoMock = require('treo');
    toolboxMock = require('sw-toolbox');

    toolboxMock.mockSetup();
    treoMock.setValue([]);

    global.Request = require('test/mocks/request');
    global.Response = require('test/mocks/response');
    global.Blob = require('test/mocks/blob');

    serviceable = require('application/client/sw/sync/serviceable');
  });

  after('sw/sync/serviceable teardown', function () {
    delete global.Request;
    delete global.Response;
    delete global.Blob;

    toolboxMock.mockTeardown();
    self.teardown();
    mocks.swSyncIndex.end();
    mocks.swData.end();
  });

  function createDehydratedRequests (bodies) {
    // the side-effect output
    dehydratedRequests = [];

    treoMock.setReporter(function (method, key, request) {
      if (method === 'put') {
        // allow the body to determine fake ordering via fake timestamp.
        request.timestamp = request.body.timestamp || request.timestamp;
        delete request.body.timestamp;

        dehydratedRequests.push(request);
      }
    });

    return Promise.all(bodies.map(function (body) {
      return index.deferRequest('/api', new global.Request('someurl', {
        body: body
      }));
    }));
  }

  describe('getRequests', function () {
    it('should get contact and topic requests', function (done) {
      createDehydratedRequests([
        syncable.contact({
          some1: 'body1'
        }, 'test1@email'),
        syncable.push({
          some2: 'body2',
          tag: 'someTopic'
        }, subscriptionId, syncable.ops.updateTopics)
      ])
      .then(function () {
        return serviceable.getRequests(dehydratedRequests);
      })
      .then(function (serviceableRequests) {
        var diff = _.xor(dehydratedRequests, serviceableRequests);

        expect(diff.length).to.equal(0);
        done();
      });
    });

    it('should get both contact and unsubscribe requests', function (done) {
      createDehydratedRequests([
        syncable.contact({
          some1: 'body1'
        }, 'test1@email'),
        syncable.push({
          some2: 'body2'
        }, subscriptionId, syncable.ops.unsubscribe)
      ])
      .then(function () {
        return serviceable.getRequests(dehydratedRequests);
      })
      .then(function (serviceableRequests) {
        var diff = _.xor(dehydratedRequests, serviceableRequests);

        expect(diff.length).to.equal(0);
        done();
      });
    });

    it('should get unsubscribe requests over topics requests', function (done) {
      createDehydratedRequests([
        syncable.push({
          some1: 'body1'
        }, subscriptionId, syncable.ops.updateTopics),
        syncable.push({
          some2: 'body2'
        }, subscriptionId, syncable.ops.unsubscribe)
      ])
      .then(function () {
        return serviceable.getRequests(dehydratedRequests);
      })
      .then(function (serviceableRequests) {
        expect(serviceableRequests.length).to.equal(1);
        expect(serviceableRequests[0].fallback.operation)
          .to.equal(syncable.ops.unsubscribe);
        done();
      });
    });
  });

  describe('pruneRequests', function () {
    it('should remove unserviceable requests', function (done) {
      var updateTopicsTime = 1001, calledDel = 0;

      createDehydratedRequests([
        syncable.push({
          some1: 'body1',
          timestamp: updateTopicsTime
        }, subscriptionId, syncable.ops.updateTopics),
        syncable.push({
          some2: 'body2',
          timestamp: updateTopicsTime + 1
        }, subscriptionId, syncable.ops.unsubscribe)
      ])
      .then(function () {
        return serviceable.getRequests(dehydratedRequests);
      })
      .then(function (serviceableRequests) {
        // Replace previous reporter to listen for 'del'
        treoMock.setReporter(function (method, key) {
          if (method === 'del') {
            // should've deleted updateTopics as unserviceable since it
            // received unsubscribe later (updateTopicsTime + 1).
            expect(key).to.equal(updateTopicsTime);
            calledDel++;
          }
        });

        return serviceable.pruneRequests(dehydratedRequests, serviceableRequests);
      })
      .then(function () {
        expect(calledDel).to.equal(1);
        done();
      });
    });
  });

  describe('pruneRequestsByPolicy', function () {
    /**
     * Remove a dehydrateRequest from dehydratedRequests if it matches
     * the given timestamp.
     *
     * @param {String} the timestamp to match.
     * @returns {Object} The matching dehydrateRequest.
     */
    function removeMatchingDehydratedRequest (timestamp) {
      var matchingRequest;

      dehydratedRequests = dehydratedRequests.reduce(function (prev, curr) {
        if (curr.timestamp === timestamp) {
          matchingRequest = curr;
          return prev;
        }
        prev.push(curr);
        return prev;
      }, []);

      return matchingRequest;
    }

    it('should remove prior matching contact requests by policy', function (done) {
      var calledDel = 0,
        contactKey = 'test1@email',
        contactTime = 1001,
        contactTimesToDelete = [
          contactTime,
          contactTime + 1
        ];

      createDehydratedRequests([
        syncable.contact({
          some1: 'body1',
          timestamp: contactTimesToDelete[0]
        }, contactKey),
        syncable.contact({
          some2: 'body2',
          timestamp: contactTimesToDelete[1]
        }, contactKey),
        syncable.contact({
          some3: 'body3',
          timestamp: contactTime + 2 // 'successful'
        }, contactKey)
      ])
      .then(function () {
        return removeMatchingDehydratedRequest(contactTime + 2);
      })
      .then(function (reqContact) {
        // Replace previous reporter to listen for 'del'
        treoMock.setReporter(function (method, key) {
          if (method === 'del') {
            expect(contactTimesToDelete.indexOf(key) !== -1).to.be.true;
            calledDel++;
          }
        });

        return serviceable.pruneRequestsByPolicy(
          dehydratedRequests, reqContact.fallback
        );
      })
      .then(function () {
        expect(calledDel).to.equal(dehydratedRequests.length);
        done();
      });
    });

    describe('push requests', function () {
      var calledDel,
        pushTime = 1001,
        pushTimesToDelete = [
          pushTime,
          pushTime + 1,
          pushTime + 2,
          pushTime + 3,
          pushTime + 4
        ],
        pushTimesToIgnore = [
          pushTime + 5,
          pushTime + 6,
          pushTime + 7,
          pushTime + 8,
          pushTime + 9
        ],
        pushTimeSuccess = pushTime + 10;

      beforeEach(function () {
        calledDel = 0;
      });

      /**
       * Verify that all dehydratedRequests are removed by pruneRequestsByPolicy.
       *
       * @param {Number} timestamp - The key of the successful dehydrated
       * request to remove from the dehydratedRequests collection to use as the
       * successful request.
       * @param {function} done - done callback.
       * @param {Number} [deleted] - The expected number of deletes (removals).
       * If falsy, then defaults to all.
       * @returns {Promise} resolves to undefined on completion.
       */
      function shouldRemove (timestamp, done, deleted) {
        var reqPush = removeMatchingDehydratedRequest(timestamp);

        // Replace previous reporter to listen for 'del'
        treoMock.setReporter(function (method, key) {
          if (method === 'del') {
            expect(pushTimesToDelete.indexOf(key) !== -1).to.be.true;
            calledDel++;
          }
        });

        return serviceable.pruneRequestsByPolicy(
          dehydratedRequests, reqPush.fallback, reqPush
        )
        .then(function () {
          expect(calledDel).to.equal(deleted || dehydratedRequests.length);
          done();
        })
        .catch(function (error) {
          done(error || unexpectedFlowError);
        });
      }

      it('successful subscribe should remove all', function (done) {
        createDehydratedRequests([
          syncable.push({
            some1: 'body1',
            timestamp: pushTimesToDelete[0]
          }, subscriptionId, syncable.ops.updateTopics),
          syncable.push({
            some2: 'body2',
            timestamp: pushTimesToDelete[1]
          }, subscriptionId, syncable.ops.unsubscribe),
          syncable.push({
            some3: 'body3',
            timestamp: pushTimeSuccess
          }, subscriptionId, syncable.ops.subscribe)
        ]).then(function () {
          shouldRemove(pushTimeSuccess, done);
        });
      });

      it('successful unsubscribe should remove all', function (done) {
        createDehydratedRequests([
          syncable.push({
            some1: 'body1',
            timestamp: pushTimesToDelete[0]
          }, subscriptionId, syncable.ops.updateTopics),
          syncable.push({
            some2: 'body2',
            timestamp: pushTimesToDelete[1]
          }, subscriptionId, syncable.ops.subscribe),
          syncable.push({
            some3: 'body3',
            timestamp: pushTimeSuccess
          }, subscriptionId, syncable.ops.unsubscribe)
        ])
        .then(function () {
          shouldRemove(pushTimeSuccess, done);
        });
      });

      it('successful subscribe should remove all except updateSubscription',
      function (done) {
        createDehydratedRequests([
          syncable.push({
            some1: 'body1',
            timestamp: pushTimesToDelete[0]
          }, subscriptionId, syncable.ops.updateTopics),
          syncable.push({
            some2: 'body2',
            timestamp: pushTimesToIgnore[0]
          }, subscriptionId, syncable.ops.updateSubscription),
          syncable.push({
            some3: 'body3',
            timestamp: pushTimeSuccess
          }, subscriptionId, syncable.ops.subscribe)
        ]).then(function () {
          shouldRemove(pushTimeSuccess, done, 1);
        });
      });

      it('successful updateTopics should remove unsub and updateTopics with same tag',
      function (done) {
        var updateTopicsTag = 'push-update-topic';

        createDehydratedRequests([
          syncable.push({
            body: {
              context: {},
              requests: {
                g0: {
                  body: {
                    topics: [{
                      subscribed: true,
                      tag: updateTopicsTag,
                      label: 'blah'
                    }]
                  },
                  params: {
                    subscriptionId: '123'
                  },
                  resource: 'blah'
                }
              }
            },
            timestamp: pushTimesToDelete[0]
          }, subscriptionId, syncable.ops.updateTopics),
          syncable.push({
            body: {
              context: {},
              requests: {
                g0: {
                  body: {
                    topics: [{
                      subscribed: true,
                      tag: 'push-update-topic-2',
                      label: 'blah'
                    }]
                  },
                  params: {
                    subscriptionId: '123'
                  },
                  resource: 'blah'
                }
              }
            },
            timestamp: pushTimesToIgnore[0]
          }, subscriptionId, syncable.ops.updateTopics),
          syncable.push({
            some2: 'body2',
            timestamp: pushTimesToIgnore[1]
          }, subscriptionId, syncable.ops.updateSubscription),
          syncable.push({
            some3: 'body3',
            timestamp: pushTimesToIgnore[2]
          }, subscriptionId, syncable.ops.subscribe),
          syncable.push({
            some3: 'body3',
            timestamp: pushTimesToDelete[1]
          }, subscriptionId, syncable.ops.unsubscribe),
          syncable.push({
            body: {
              context: {},
              requests: {
                g0: {
                  body: {
                    topics: [{
                      subscribed: true,
                      tag: updateTopicsTag,
                      label: 'blah'
                    }]
                  },
                  params: {
                    subscriptionId: '123'
                  },
                  resource: 'blah'
                }
              }
            },
            timestamp: pushTimeSuccess
          }, subscriptionId, syncable.ops.updateTopics)
        ]).then(function () {
          shouldRemove(pushTimeSuccess, done, 2);
        });
      });
    });

    it('should resolve to undefined if no policy found', function (done) {
      var calledDel = 0, invalidType = 'invalid';

      expect(Object.keys(syncable.types).indexOf(invalidType)).to.equal(-1);

      // Replace previous reporter to listen for 'del'
      treoMock.setReporter(function (method) {
        if (method === 'del') {
          calledDel++;
        }
      });

      serviceable.pruneRequestsByPolicy(null, {
        type: invalidType
      })
      .then(function (result) {
        expect(result).to.be.undefined;
        expect(calledDel).to.equal(0);
        done();
      });
    });
  });

  describe('updatePushSubscription', function () {
    beforeEach(function () {
      treoMock.setReporter(null);
      treoMock.setValue(null);
    });

    it('should do nothing if falsy subscriptionId supplied', function (done) {
      var calledAll = 0;

      // Replace previous reporter to listen for 'all'
      treoMock.setReporter(function (method) {
        if (method === 'all') {
          calledAll++;
        }
      });

      serviceable.updatePushSubscription(false)
      .then(function () {
        expect(calledAll).to.equal(0);
        done();
      })
      .catch(function (error) {
        done(error || unexpectedFlowError);
      });
    });

    it('should not update if params not found in request', function (done) {
      var calledPut = 0;

      createDehydratedRequests([
        syncable.push({
          subscriptionId: subscriptionId
        }, subscriptionId, syncable.ops.subscribe)
      ]).then(function () {
        treoMock.setValue(dehydratedRequests);

        // Replace previous reporter to listen for 'put'
        treoMock.setReporter(function (method) {
          if (method === 'put') {
            calledPut++;
          }
        });

        serviceable.updatePushSubscription(subscriptionId)
        .then(function () {
          expect(calledPut).to.equal(0);
          done();
        })
        .catch(function (error) {
          done(error || unexpectedFlowError);
        });
      });
    });

    it('should update if params and subscriptionId found in request',
    function (done) {
      var property = require('utils/property');
      var calledPut = 0, putParams;
      var testObject = syncable.push({
        params: {
          subscriptionId: subscriptionId
        }
      }, subscriptionId, syncable.ops.subscribe);

      var preUpdateTestObject = Object.assign({}, testObject);
      preUpdateTestObject.params = {
        subscriptionId: subscriptionId + '-offbyone'
      };

      createDehydratedRequests([
        preUpdateTestObject
      ]).then(function () {
        treoMock.setValue(dehydratedRequests);

        // Replace previous reporter to listen for 'put'
        treoMock.setReporter(function (method, key, value) {
          if (method === 'put') {
            calledPut++;
            putParams = property.find('params', value);
          }
        });

        // Make sure params are different as a precondition
        var preParams = property.find('params', dehydratedRequests[0]);
        expect(preParams).to.exist.and.not.eql(testObject.params);

        serviceable.updatePushSubscription(subscriptionId)
        .then(function () {
          expect(calledPut).to.equal(1);
          expect(putParams).to.eql(testObject.params);
          done();
        })
        .catch(function (error) {
          done(error || unexpectedFlowError);
        });
      });
    });
  });
});
