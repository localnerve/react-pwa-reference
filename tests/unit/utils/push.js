/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it */
'use strict';

var expect = require('chai').expect;

var push = require('../../../utils/push');

describe('push', function () {
  it('should expose getSubscriptionId', function () {
    expect(push).to.respondTo('getSubscriptionId');
  });

  describe('getSubscriptionId', function () {
    var subId = '1234',
      subId2 = '5678',
      endpoint = 'https://endpoint/'+subId2;

    it('should return null if falsy subscription supplied', function () {
      expect(push.getSubscriptionId()).to.be.null;
    });

    it('should return null if no endpoint or getKey', function () {
      expect(push.getSubscriptionId({})).to.be.null;
    });

    it('should return subscriptionId from endpoint', function () {
      expect(push.getSubscriptionId({
        endpoint: endpoint
      })).to.equal(subId2);
    });

    it('should use getKey if no endpoint', function () {
      expect(push.getSubscriptionId({
        getKey: function () {
          return subId;
        }
      })).to.equal(subId);
    });
  });
});
