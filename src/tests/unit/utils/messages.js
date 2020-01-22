/**
 * Copyright (c) 2016 - 2020 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global after, before, describe, it */

import { assert, expect } from 'chai';
import messages from 'utils/messages';
import { start as testDomStart, stop as testDomStop } from 'test/utils/testdom';
import mockWorker from 'test/mocks/worker';

describe('messages', () => {
  const method = 'workerSendMessage';
  const badSuccess = 'should not have succeeded';

  before('all messages', () => {
    testDomStart();
  });

  after('all messages', () => {
    testDomStop();
  });

  describe('workerSendMessage', () => {
    it('should fail if no worker is supplied', (done) => {
      messages.workerSendMessage({ none: null }).then(() => {
        assert.fail(method, method, badSuccess);
        done(`${method} ${badSuccess}`);
      }).catch(() => {
        // worked.
        done();
      });
    });

    it('should fall through if no messaging handler', (done) => {
      // Make sure serviceWorker doesn't show up in jsdom
      expect(global.navigator.serviceWorker).to.not.exist;
      expect(global.window.navigator.serviceWorker).to.not.exist;

      const worker = mockWorker.createWorker();
      messages.workerSendMessage({ none: null }, worker).then(() => {
        assert.fail(method, method, badSuccess);
        done(`${method} ${badSuccess}`);
      }, () => {
        // reject called because no serviceWorker on jsdom
        done();
      }).catch(done);
    });

    describe('MessageChannel', () => {
      // Mock a MessageChannel to return a shared object on construction.
      const messageChannel = {
        port1: {},
        port2: {}
      };
      function MessageChannel () {
        return messageChannel;
      }

      before('message channel', () => {
        // expect no MessageChannel on jsdom - if it changes, get notified here.
        expect(global.window.MessageChannel).to.not.exist;
        expect(global.MessageChannel).to.not.exist;
        global.window.MessageChannel = MessageChannel;
        global.MessageChannel = MessageChannel;
      });

      after('message channel', () => {
        global.window.MessageChannel = undefined;
      });

      it('should use message channel if exists, success', (done) => {
        // give the shared object to the mock worker.
        const worker = mockWorker.createWorker({
          messageChannel: messageChannel
        });

        messages.workerSendMessage({ empty: null }, worker).then((data) => {
          expect(data.handled).to.equal(mockWorker.handled.messageChannel);
          done();
        }).catch(done);
      });

      it('should use message channel if exists, failure', (done) => {
        // give the shared object to the mock worker.
        const worker = mockWorker.createWorker({
          messageChannel: messageChannel,
          simulateError: true
        });

        messages.workerSendMessage({ empty: null }, worker).then(() => {
          assert.fail(method, method, badSuccess);
          done(`${method} ${badSuccess}`);
        }, (error) => {
          expect(error).to.be.true;
          done();
        }).catch((error) => {
          done(error);
        });
      });
    });

    describe('worker.onmessage', () => {
      it('should use worker onmessage if message channel does not exist, success', (done) => {
        const worker = mockWorker.createWorker({
          onmessage: true
        });

        messages.workerSendMessage({ empty: null }, worker).then((data) => {
          expect(data.handled).to.equal(mockWorker.handled.worker);
          done();
        }).catch(done);
      });

      it('should use worker onmessage if message channel does not exist, failure', (done) => {
        const worker = mockWorker.createWorker({
          onmessage: true,
          simulateError: true
        });

        messages.workerSendMessage({ empty: null }, worker).then(() => {
          assert.fail(method, method, badSuccess);
          done(`${method} ${badSuccess}`);
        }, (error) => {
          expect(error).to.be.true;
          done();
        }).catch(done);
      });
    });
  });
});
