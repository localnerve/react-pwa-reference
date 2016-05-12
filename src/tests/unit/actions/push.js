/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it, before, after, beforeEach */
'use strict';

var expect = require('chai').expect;

var MockService = require('fluxible-plugin-fetchr/utils/MockServiceManager');
var SettingsStore = require('application/stores/SettingsStore').SettingsStore;
var createMockActionContext = require('fluxible/utils').createMockActionContext;
var pushAction = require('application/actions/push');

var testDom = require('test/utils/testdom');
var setupPushManager = require('test/mocks/global').setupPushManager;
var setupPermissions = require('test/mocks/global').setupPermissions;
var setupNotification = require('test/mocks/global').setupNotification;
var getSettingsFields = require('test/utils/settings').getSettingsFields;
var subscription = require('test/mocks/subscription');

describe('push action', function () {
  var context;

  beforeEach(function () {
    context = createMockActionContext({
      stores: [ SettingsStore ]
    });
    context.service = new MockService();
    context.service.setService('subscription', function (method) {
      var args = Array.prototype.slice.call(arguments, 1);
      subscription[method].apply(subscription, args);
    });
  });

  describe('topics', function () {
    it('should get topics', function (done) {
      context.executeAction(pushAction.getTopics, {}, function (err) {
        if (err) {
          return done(err);
        }

        var fields = getSettingsFields(context, SettingsStore);
        expect(fields.pushTopicsError).to.be.null;
        expect(subscription.topics).to.eql(fields.pushTopics);
        done();
      });
    });

    it('should get topics with error', function (done) {
      context.executeAction(pushAction.getTopics, {
        emulateError: true
      }, function (err) {
        var fields = getSettingsFields(context, SettingsStore);
        expect(err).to.be.an('Error');
        expect(fields.pushTopicsError).to.not.be.null;
        done();
      });
    });

    it('should update topics', function (done) {
      var updates = subscription.updateTopic;
      context.executeAction(pushAction.updateTopics, {
        topics: updates
      }, function (err) {
        if (err) {
          return done(err);
        }

        var fields = getSettingsFields(context, SettingsStore);
        expect(fields.pushTopics).to.eql(updates);
        expect(fields.pushTopicsError).to.be.null;
        done();
      });
    });

    it('should update topics with error', function (done) {
      context.executeAction(pushAction.updateTopics, {
        emulateError: true
      }, function (err) {
        var fields = getSettingsFields(context, SettingsStore);
        expect(err).to.be.an('Error');
        expect(fields.pushTopicsError).to.not.be.null;
        done();
      });
    });
  });

  describe('un/subscribe', function () {
    before(function () {
      testDom.start();
    });

    after(function () {
      testDom.stop();
    });

    describe('subscribe', function () {
      /**
       * Execute pushAction.subscribe and check error result.
       */
      function executeSubscribeCheckError (pushOptions, done) {
        context.executeAction(pushAction.subscribe, {}, function (err) {
          var fields = getSettingsFields(context, SettingsStore);
          expect(err).to.be.an('Error');
          expect(fields.pushSubscriptionError).to.not.be.null;
          expect(fields.pushSubscription).to.be.null;
          expect(fields.pushTopics).to.be.null;
          expect(pushOptions.countPostMessage).to.equal(0);
          done();
        });
      }

      it('should create a subscription', function (done) {
        var pushOptions = {
          countPostMessage: 0
        };
        var sub = setupPushManager(pushOptions);

        context.executeAction(pushAction.subscribe, {}, function (err) {
          if (err) {
            return done(err);
          }

          var fields = getSettingsFields(context, SettingsStore);
          expect(fields.pushSubscriptionError).to.be.null;
          expect(fields.pushSubscription).to.eql(sub);
          expect(fields.pushTopics).to.eql(subscription.topics);
          expect(pushOptions.countPostMessage).to.equal(1);
          done();
        });
      });

      // This is a pretty ugly case. I'm not sure I like the result state yet.
      it('should handle postMessage error', function (done) {
        var pushOptions = {
          countPostMessage: 0,
          postMessageFail: true
        };

        setupPushManager(pushOptions);

        context.executeAction(pushAction.subscribe, {}, function (err) {
          var fields = getSettingsFields(context, SettingsStore);
          expect(err).to.be.an('Error');
          expect(fields.pushSubscriptionError).to.not.be.null;
          expect(fields.pushSubscription).to.be.null;
          expect(fields.pushTopics).to.be.null;
          expect(pushOptions.countPostMessage).to.equal(1);
          expect(err.toString().toLowerCase()).to.contain('postmessage');
          done();
        });
      });

      it('should handle a service error', function (done) {
        var pushOptions = {
          countPostMessage: 0
        };

        setupPushManager(pushOptions);

        context.executeAction(pushAction.subscribe, {
          emulateError: true
        }, function (err) {
          var fields = getSettingsFields(context, SettingsStore);
          expect(err).to.be.an('Error');
          expect(fields.pushSubscriptionError).to.not.be.null;
          expect(fields.pushTopics).to.be.null;
          expect(pushOptions.countPostMessage).to.equal(2);
          done();
        });
      });

      // I'm not sure this case makes sense.
      it('should handle subscription reject without permissions or notifications', function (done) {
        var pushOptions = {
          countPostMessage: 0,
          rejectSubcribe: true
        };

        setupPushManager(pushOptions);

        executeSubscribeCheckError(pushOptions, done);
      });

      it('should handle subscription reject with notification, denied', function (done) {
        var pushOptions = {
          countPostMessage: 0,
          rejectSubcribe: true
        };

        setupPushManager(pushOptions);
        setupNotification({
          permission: 'denied'
        });
        context.getStore(SettingsStore).updateSettingsState({
          hasNotifications: true
        });

        executeSubscribeCheckError(pushOptions, done);
      });

      it('should handle subscription reject with permissions, prompt', function (done) {
        var pushOptions = {
          countPostMessage: 0,
          rejectSubcribe: true
        };

        setupPushManager(pushOptions);
        setupPermissions({
          state: 'prompt'
        });
        context.getStore(SettingsStore).updateSettingsState({
          hasPermissions: true
        });

        executeSubscribeCheckError(pushOptions, done);
      });

      it('should handle subscription reject with permissions, denied', function (done) {
        var pushOptions = {
          countPostMessage: 0,
          rejectSubcribe: true
        };

        setupPushManager(pushOptions);
        setupPermissions({
          state: 'denied'
        });
        context.getStore(SettingsStore).updateSettingsState({
          hasPermissions: true
        });

        executeSubscribeCheckError(pushOptions, done);
      });

      it('should handle subscription reject with permission reject', function (done) {
        var pushOptions = {
          countPostMessage: 0,
          rejectSubcribe: true
        };

        setupPushManager(pushOptions);
        setupPermissions({
          rejectQuery: true
        });
        context.getStore(SettingsStore).updateSettingsState({
          hasPermissions: true
        });

        executeSubscribeCheckError(pushOptions, done);
      });
    });

    describe('unsubscribe', function () {
      it('should unsubcribe a subscription', function (done) {
        var pushOptions = {
          countPostMessage: 0,
          succeedUnsub: true
        };

        setupPushManager(pushOptions);

        context.executeAction(pushAction.unsubscribe, {}, function (err) {
          if (err) {
            return done(err);
          }

          var fields = getSettingsFields(context, SettingsStore);
          expect(fields.pushSubscription).to.be.null;
          expect(fields.pushTopics).to.be.null;
          expect(fields.pushSubscriptionError).to.be.null;
          expect(pushOptions.countPostMessage).to.equal(1);
          done();
        });
      });

      // This is an ugly case. I'm not sure this is really handled.
      it('should handle postMessage error', function (done) {
        var pushOptions = {
          countPostMessage: 0,
          postMessageFail: true,
          succeedUnsub: true
        };

        setupPushManager(pushOptions);

        context.executeAction(pushAction.unsubscribe, {}, function (err) {
          var fields = getSettingsFields(context, SettingsStore);
          expect(err).to.be.an('Error');
          expect(fields.pushSubscription).to.be.null;
          expect(fields.pushTopics).to.be.null;
          expect(fields.pushSubscriptionError).to.not.be.null;
          expect(pushOptions.countPostMessage).to.equal(1);
          expect(err.toString().toLowerCase()).to.contain('postmessage');
          done();
        });
      });

      it('should handle an unsubscribe failure', function (done) {
        var pushOptions = {
          countPostMessage: 0,
          succeedUnsub: false
        };

        setupPushManager(pushOptions);

        context.executeAction(pushAction.unsubscribe, {}, function (err) {
          var fields = getSettingsFields(context, SettingsStore);
          expect(fields.pushSubscriptionError).to.not.be.null;
          expect(err).to.be.an('Error');
          expect(pushOptions.countPostMessage).to.equal(0);
          done();
        });
      });

      it('should handle a service error', function (done) {
        var pushOptions = {
          countPostMessage: 0,
          succeedUnsub: true
        };

        setupPushManager(pushOptions);

        context.executeAction(pushAction.unsubscribe, {
          emulateError: true
        }, function (err) {
          var fields = getSettingsFields(context, SettingsStore);
          expect(fields.pushSubscriptionError).to.not.be.null;
          expect(err).to.be.an('Error');
          expect(pushOptions.countPostMessage).to.equal(2);
          done();
        });
      });

      it('should handle an unsubscribe reject', function (done) {
        setupPushManager({
          succeedUnsub: true,
          rejectUnsub: true
        });

        context.executeAction(pushAction.unsubscribe, {}, function (err) {
          var fields = getSettingsFields(context, SettingsStore);
          expect(fields.pushSubscriptionError).to.not.be.null;
          expect(err).to.be.an('Error');
          done();
        });
      });

      it('should handle getSubscription reject', function (done) {
        setupPushManager({
          rejectGetSub: true
        });

        context.executeAction(pushAction.unsubscribe, {}, function (err) {
          var fields = getSettingsFields(context, SettingsStore);
          expect(fields.pushSubscriptionError).to.not.be.null;
          expect(err).to.be.an('Error');
          done();
        });
      });
    });
  });
});
