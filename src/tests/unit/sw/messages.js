/***
 * Copyright (c) 2016 - 2022 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global Promise, after, before, beforeEach, describe, it */

const expect = require('chai').expect;
const mocks = require('test/mocks');
const Self = require('test/mocks/self');

describe('sw/messages', () => {
  let selfMock, initMock, pushSyncMock, treoMock,
    calledPostMessage,
    unexpectedFlowError = new Error('unexpected messages error');

  before('sw/messages', function () {
    this.timeout(5000);
    mocks.swData.begin();
    mocks.swInit.begin();
    mocks.swSyncPush.begin();
    mocks.swUtilsIdbTreo.begin();

    treoMock = require('treo');
    treoMock.setValue(null);

    selfMock = new Self();
    selfMock.setup();

    global.clients = {
      matchAll: function () {
        return Promise.resolve([{
          postMessage: function () {
            calledPostMessage++;
          }
        }]);
      }
    };

    initMock = require('./init');
    pushSyncMock = require('./sync/push');
    require('application/client/sw/messages');
  });

  after('sw/message', () => {
    delete global.clients;
    selfMock.teardown();
    mocks.swUtilsIdbTreo.end();
    mocks.swSyncPush.end();
    mocks.swInit.end();
    mocks.swData.end();
  });

  beforeEach('sw/message', () => {
    calledPostMessage = 0;
  });

  describe('message event', () => {
    function createEventSource (handler) {
      return {
        postMessage: handler
      };
    }

    function noWaitUntil (command, done) {
      selfMock.events.message({
        data: {
          command: command,
          payload: {}
        },
        source: createEventSource(() => {
          done();
        })
      });
    }

    function useWaitUntil (command, done) {
      selfMock.events.message({
        data: {
          command: command,
          payload: {}
        },
        source: createEventSource(() => {
          calledPostMessage++;
        }),
        waitUntil: (promise) => {
          promise.then(() => {
            expect(calledPostMessage).to.equal(1);
            done();
          }).catch((error) => {
            done(error || unexpectedFlowError);
          });
        }
      });
    }

    function skipClients (command, done) {
      selfMock.setup({
        clients: false
      });
      selfMock.events.message({
        data: {
          command: command,
          payload: {}
        },
        waitUntil: (promise) => {
          promise.then(() => {
            expect(calledPostMessage).to.equal(0);
            done();
          }).catch((error) => {
            done(error || unexpectedFlowError);
          });
        }
      });
    }

    function useClients (command, done) {
      selfMock.events.message({
        data: {
          command: command,
          payload: {}
        },
        waitUntil: (promise) => {
          promise.then(() => {
            expect(calledPostMessage).to.equal(1);
            done();
          }).catch((error) => {
            done(error || unexpectedFlowError);
          })
        }
      });
    }

    beforeEach('message event', () => {
      selfMock.setup({
        clients: true
      });
    });

    describe('unknown command', () => {
      it('should handle no waitUntil as expected', (done) => {
        noWaitUntil('unk', done);
      });

      it('should use waitUntil if exists', (done) => {
        useWaitUntil('unk', done);
      });

      it('should skip postMessage if no clients', (done) => {
        selfMock.setup({
          clients: false
        });
        skipClients('unk', done);
      });

      it('should use postMessage if clients', (done) => {
        useClients('unk', done);
      });
    });

    describe('init command', () => {
      beforeEach('init command', () => {
        initMock.setEmulateError(false);
        initMock.setMockInitData();
      });

      it('should handle no waitUntil as expected', (done) => {
        noWaitUntil('init', done);
      });

      it('should use waitUntil if exists', (done) => {
        useWaitUntil('init', done);
      });

      it('should skip postMessage if no clients', (done) => {
        selfMock.setup({
          clients: false
        });
        skipClients('init', done);
      });

      it('should use postMessage if clients', (done) => {
        useClients('init', done);
      });

      it('should handle command failure', (done) => {
        initMock.setEmulateError(true);
        const mockError = initMock.getMockError();

        selfMock.events.message({
          data: {
            command: 'init'
          },
          source: createEventSource((response) => {
            calledPostMessage++;
            expect(response.error).to.eql(mockError.toString());
          }),
          waitUntil: (promise) => {
            promise.then(() => {
              expect(calledPostMessage).to.equal(1);
              done();
            }).catch((error) => {
              done(error || unexpectedFlowError);
            });
          }
        });
      });

      it('should handle command success', (done) => {
        selfMock.events.message({
          data: {
            command: 'init'
          },
          source: createEventSource((response) => {
            calledPostMessage++;
            expect(response.error).to.be.null;
          }),
          waitUntil: (promise) => {
            promise.then(() => {
              expect(calledPostMessage).to.equal(1);
              done();
            }).catch((error) => {
              done(error || unexpectedFlowError);
            });
          }
        });
      });
    });

    describe('pushSync command', () => {
      beforeEach('pushSync command', () => {
        pushSyncMock.setEmulateError(false);
        pushSyncMock.setValue();
      });

      it('should handle no waitUntil as expected', (done) => {
        noWaitUntil('pushSync', done);
      });

      it('should use waitUntil if exists', (done) => {
        useWaitUntil('pushSync', done);
      });

      it('should skip postMessage if no clients', (done) => {
        selfMock.setup({
          clients: false
        });
        skipClients('pushSync', done);
      });

      it('should use postMessage if clients', (done) => {
        useClients('pushSync', done);
      });

      it('should handle command failure', (done) => {
        pushSyncMock.setEmulateError(true);
        const mockError = pushSyncMock.getMockError();

        selfMock.events.message({
          data: {
            command: 'pushSync',
            payload: {}
          },
          source: createEventSource((response) => {
            calledPostMessage++;
            expect(response.error).to.eql(mockError.toString());
          }),
          waitUntil: (promise) => {
            promise.then(() => {
              expect(calledPostMessage).to.equal(1);
              done();
            }).catch((error) => {
              done(error || unexpectedFlowError);
            });
          }
        });
      });

      it('should handle command success', (done) => {
        selfMock.events.message({
          data: {
            command: 'pushSync',
            payload: {}
          },
          source: createEventSource((response) => {
            calledPostMessage++;
            expect(response.error).to.be.null;
          }),
          waitUntil: (promise) => {
            promise.then(() => {
              expect(calledPostMessage).to.equal(1);
              done();
            }).catch((error) => {
              done(error || unexpectedFlowError);
            });
          }
        });
      });
    });
  });
});
