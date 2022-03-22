/**
 * Copyright (c) 2016 - 2022 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it, beforeEach */
'use strict';

var expect = require('chai').expect;
var SettingsStore = require('application/stores/SettingsStore').SettingsStore;

describe('settings store', function () {
  var storeInstance;
  /*
  var payload = {
    hasServiceWorker: false,
    hasPushMessaging: false,
    hasPermissions: false,
    hasNotifications: false,
    pushBlocked: true,
    syncBlocked: true,
    subscription: null
  };
  */
  var payloadTrue = {
    hasServiceWorker: true,
    hasPushMessaging: true,
    hasPermissions: true,
    hasNotifications: true,
    pushBlocked: true,
    syncBlocked: true,
    pushSubscription: true,
    pushSubscriptionError: true,
    pushTopics: true,
    pushTopicsError: true,
    transition: {}
  };

  function testPayloadTrue (state) {
    Object.keys(state).forEach(function (key) {
      if (key === 'transition') {
        expect(state[key]).to.be.an('object').that.is.empty;
      } else {
        expect(state[key]).to.equal(true);
      }
    });
  }

  beforeEach(function () {
    storeInstance = new SettingsStore();
  });

  it('should instantiate correctly', function () {
    expect(storeInstance).to.be.an('object');
    expect(storeInstance.hasServiceWorker).to.equal(false);
    expect(storeInstance.hasPushMessaging).to.equal(false);
    expect(storeInstance.hasPermissions).to.equal(false);
    expect(storeInstance.hasNotifications).to.equal(false);
    expect(storeInstance.pushBlocked).to.equal(false);
    expect(storeInstance.syncBlocked).to.equal(false);
    expect(storeInstance.pushSubscription).to.be.null;
    expect(storeInstance.pushSubscriptionError).to.be.null;
    expect(storeInstance.pushTopics).to.be.null;
    expect(storeInstance.pushTopicsError).to.be.null;
    expect(storeInstance.transition).to.be.an('object').that.is.empty;
  });

  describe('update', function () {
    it('should update all items', function () {
      storeInstance.updateSettingsState(payloadTrue);
      var state = storeInstance.dehydrate();

      testPayloadTrue(state);
    });

    it('should update one item', function () {
      storeInstance.updateSettingsState(payloadTrue);
      storeInstance.updateSettingsState({
        hasPermissions: false
      });
      expect(storeInstance.getHasPermissions()).to.equal(false);
    });
  });

  it('should dehydrate', function () {
    storeInstance.updateSettingsState(payloadTrue);
    var state = storeInstance.dehydrate();

    testPayloadTrue(state);
  });

  it('should rehydrate', function () {
    var state = payloadTrue;

    storeInstance.rehydrate(state);

    testPayloadTrue(state);
  });
});
