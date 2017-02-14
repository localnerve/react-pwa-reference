/**
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global after, before, describe, it */
'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;
var messages = require('utils/messages');
var testDom = require('test/utils/testdom');
var mockWorker = require('test/mocks/worker');

describe('messages', function () {
  var method = 'workerSendMessage', badSuccess = 'should not have succeeded';

  before('all messages', function () {
    testDom.start();
  });

  after('all messages', function () {
    testDom.stop();
  });

  describe('workerSendMessage', function () {
    it('should fail if no worker is supplied', function (done) {
      messages.workerSendMessage({ none: null }).then(function () {
        assert.fail(method, method, badSuccess);
        done(method + ' ' + badSuccess);
      }).catch(function () {
        // worked.
        done();
      });
    });

    it('should fall through if no messaging handler', function (done) {
      // Make sure serviceWorker doesn't show up in jsdom
      expect(global.navigator.serviceWorker).to.not.exist;
      expect(global.window.navigator.serviceWorker).to.not.exist;

      var worker = mockWorker.createWorker();
      messages.workerSendMessage({ none: null }, worker).then(function () {
        assert.fail(method, method, badSuccess);
        done(method+' '+badSuccess);
      }, function () {
        // reject called because no serviceWorker on jsdom
        done();
      }).catch(done);
    });

    describe('MessageChannel', function () {
      // Mock a MessageChannel to return a shared object on construction.
      var messageChannel = {
        port1: {},
        port2: {}
      };
      function MessageChannel () {
        return messageChannel;
      }

      before('message channel', function () {
        // expect no MessageChannel on jsdom - if it changes, get notified here.
        expect(global.window.MessageChannel).to.not.exist;
        expect(global.MessageChannel).to.not.exist;
        global.window.MessageChannel = MessageChannel;
        global.MessageChannel = MessageChannel;
      });

      after('message channel', function () {
        global.window.MessageChannel = undefined;
      });

      it('should use message channel if exists, success', function (done) {
        // give the shared object to the mock worker.
        var worker = mockWorker.createWorker({
          messageChannel: messageChannel
        });

        messages.workerSendMessage({ empty: null }, worker).then(function (data) {
          expect(data.handled).to.equal(mockWorker.handled.messageChannel);
          done();
        }).catch(done);
      });

      it('should use message channel if exists, failure', function (done) {
        // give the shared object to the mock worker.
        var worker = mockWorker.createWorker({
          messageChannel: messageChannel,
          simulateError: true
        });

        messages.workerSendMessage({ empty: null }, worker).then(function () {
          assert.fail(method, method, badSuccess);
          done(method+' '+badSuccess);
        }, function (error) {
          expect(error).to.be.true;
          done();
        }).catch(function (error) {
          done(error);
        });
      });
    });

    describe('worker.onmessage', function () {
      it('should use worker onmessage if message channel does not exist, success', function (done) {
        var worker = mockWorker.createWorker({
          onmessage: true
        });

        messages.workerSendMessage({ empty: null }, worker).then(function (data) {
          expect(data.handled).to.equal(mockWorker.handled.worker);
          done();
        }).catch(done);
      });

      it('should use worker onmessage if message channel does not exist, failure', function (done) {
        var worker = mockWorker.createWorker({
          onmessage: true,
          simulateError: true
        });

        messages.workerSendMessage({ empty: null }, worker).then(function () {
          assert.fail(method, method, badSuccess);
          done(method+' '+badSuccess);
        }, function (error) {
          expect(error).to.be.true;
          done();
        }).catch(done);
      });
    });
  });
});
