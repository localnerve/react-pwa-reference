/**
 * Copyright (c) 2016 - 2020 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it */

import { expect } from 'chai';
import push from 'utils/push';

describe('push', () => {
  it('should expose getSubscriptionId', () => {
    expect(push).to.respondTo('getSubscriptionId');
  });

  describe('getSubscriptionId', () => {
    const subId = '1234';
    const subId2 = '5678';
    const endpoint = `https://endpoint/${subId2}`;

    it('should return null if falsy subscription supplied', () => {
      expect(push.getSubscriptionId()).to.be.null;
    });

    it('should return null if no endpoint or getKey', () => {
      expect(push.getSubscriptionId({})).to.be.null;
    });

    it('should return subscriptionId from endpoint', () => {
      expect(push.getSubscriptionId({
        endpoint
      })).to.equal(subId2);
    });

    it('should use getKey if no endpoint', () => {
      expect(push.getSubscriptionId({
        getKey: () => subId
      })).to.equal(subId);
    });
  });
});
