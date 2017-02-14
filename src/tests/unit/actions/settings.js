/**
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it, before, after, beforeEach */
'use strict';

var expect = require('chai').expect;

var createMockActionContext = require('fluxible/utils').createMockActionContext;
var SettingsStore = require('application/stores/SettingsStore').SettingsStore;
var settingsAction = require('application/actions/settings').settingsState;

var testDom = require('test/utils/testdom');
var setupPermissions = require('test/mocks/global').setupPermissions;
var setupPushManager = require('test/mocks/global').setupPushManager;
var getSettingsFields = require('test/utils/settings').getSettingsFields;

describe('settings action', function () {
  var context, params = {};

  before(function () {
    testDom.start();
  });

  after(function () {
    testDom.stop();
  });

  beforeEach(function () {
    context = createMockActionContext({
      stores: [ SettingsStore ]
    });
  });

  it('baseline jsdom environment settings', function (done) {
    context.executeAction(settingsAction, params, function (err) {
      if (err) {
        return done(err);
      }

      var fields = getSettingsFields(context, SettingsStore);

      expect(fields.hasServiceWorker).to.equal(false);
      expect(fields.hasPushMessaging).to.equal(false);
      expect(fields.hasPermissions).to.equal(false);
      expect(fields.hasNotifications).to.equal(false);
      expect(fields.pushBlocked).to.equal(false);
      expect(fields.syncBlocked).to.equal(false);
      expect(fields.pushSubscription).to.be.null;
      expect(fields.pushSubscriptionError).to.be.null;
      expect(fields.pushTopics).to.be.null;
      expect(fields.pushTopicsError).to.be.null;
      expect(fields.transition).to.be.an('object').that.is.empty;

      done();
    });
  });

  describe('mock serviceWorker', function () {
    before(function () {
      global.navigator.serviceWorker = {};
    });

    after(function () {
      delete global.navigator.serviceWorker;
    });

    it('should update the SettingsStore', function (done) {
      context.executeAction(settingsAction, params, function (err) {
        if (err) {
          return done(err);
        }

        var fields = getSettingsFields(context, SettingsStore);

        expect(fields.hasServiceWorker).to.equal(true);
        expect(fields.hasPushMessaging).to.equal(false);
        expect(fields.hasPermissions).to.equal(false);
        expect(fields.hasNotifications).to.equal(false);
        expect(fields.pushBlocked).to.equal(true);
        expect(fields.syncBlocked).to.equal(true);
        expect(fields.pushSubscription).to.be.null;
        expect(fields.pushSubscriptionError).to.be.null;
        expect(fields.pushTopics).to.be.null;
        expect(fields.pushTopicsError).to.be.null;
        expect(fields.transition).to.be.an('object').that.is.empty;

        done();
      });
    });
  });

  describe('permissions', function () {
    before(function () {
      global.navigator.serviceWorker = {};
    });

    after(function () {
      delete global.navigator.permissions;
      delete global.navigator.serviceWorker;
    });

    describe('resolve', function () {
      it('should properly reflect granted', function (done) {
        setupPermissions({ state: 'granted' });

        context.executeAction(settingsAction, params, function (err) {
          if (err) {
            return done(err);
          }

          var fields = getSettingsFields(context, SettingsStore);
          expect(fields.hasPermissions).to.equal(true);
          expect(fields.pushBlocked).to.equal(false);
          done();
        });
      });

      it('should properly reflect denied', function (done) {
        setupPermissions( { state: 'denied' });

        context.executeAction(settingsAction, params, function (err) {
          if (err) {
            return done(err);
          }

          var fields = getSettingsFields(context, SettingsStore);
          expect(fields.hasPermissions).to.equal(true);
          expect(fields.pushBlocked).to.equal(true);
          done();
        });
      });

      it('should handle onchange', function (done) {
        var permissionState = setupPermissions({ state: 'granted' });

        context.executeAction(settingsAction, params, function (err) {
          if (err) {
            return done(err);
          }

          var fields = getSettingsFields(context, SettingsStore);
          expect(fields.hasPermissions).to.equal(true);
          expect(fields.pushBlocked).to.equal(false);

          // change the state and invoke change handler.
          permissionState.state = 'denied';
          permissionState.onchange();

          fields = getSettingsFields(context, SettingsStore);
          expect(fields.pushBlocked).to.equal(true);

          done();
        });
      });
    });

    describe('reject', function () {
      it('should properly handle rejected permission promise', function (done) {
        var settingsStore = context.getStore(SettingsStore),
          pushBlocked = settingsStore.getPushBlocked();

        setupPermissions({ rejectQuery: true });

        context.executeAction(settingsAction, params, function (err) {
          if (err) {
            return done(err);
          }

          var fields = getSettingsFields(context, SettingsStore);

          expect(fields.hasPermissions).to.equal(true);

          // should be unchanged
          expect(fields.pushBlocked).to.equal(pushBlocked);
          done();
        });
      });
    });
  });

  describe('notifications', function () {
    before(function () {
      global.navigator.serviceWorker = {};
    });

    after(function () {
      delete global.window.Notification;
      delete global.navigator.serviceWorker;
    });

    it('should properly reflect granted', function (done) {
      global.window.Notification = {
        permission: 'granted'
      };

      context.executeAction(settingsAction, params, function (err) {
        if (err) {
          return done(err);
        }

        var fields = getSettingsFields(context, SettingsStore);

        expect(fields.hasNotifications).to.equal(true);
        expect(fields.pushBlocked).to.equal(false);
        done();
      });
    });

    it('should properly reflect denied', function (done) {
      global.window.Notification = {
        permission: 'denied'
      };

      context.executeAction(settingsAction, params, function (err) {
        if (err) {
          return done(err);
        }

        var fields = getSettingsFields(context, SettingsStore);

        expect(fields.hasNotifications).to.equal(true);
        expect(fields.pushBlocked).to.equal(true);
        done();
      });
    });
  });

  describe('push manager', function () {
    before(function () {
      global.navigator.serviceWorker = {};
      global.window.PushManager = {};
    });

    after(function () {
      delete global.window.PushManager;
      delete global.navigator.serviceWorker;
    });

    beforeEach(function () {
      // prevent a topics call
      var settingsStore = context.getStore(SettingsStore);
      settingsStore.updateSettingsState({
        pushTopics: ['mock']
      });
    });

    it('should push subscription resolve', function (done) {
      var subscription = setupPushManager();

      context.executeAction(settingsAction, params, function (err) {
        if (err) {
          return done(err);
        }

        var fields = getSettingsFields(context, SettingsStore);

        expect(fields.pushSubscription).to.eql(subscription);
        done();
      });
    });

    it('should handle push subscription reject', function (done) {
      setupPushManager({
        rejectGetSub: true
      });

      context.executeAction(settingsAction, params, function (err) {
        if (err) {
          return done(err);
        }

        var fields = getSettingsFields(context, SettingsStore);

        expect(fields.pushSubscription).to.be.null;
        done();
      });
    });
  });
});
