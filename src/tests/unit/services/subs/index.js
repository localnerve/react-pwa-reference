/**
 * Copyright (c) 2016 - 2021 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global before, after, describe, it */

import { expect } from 'chai';
import mocks from 'test/mocks';

describe('subs/index', () => {
  const subscriptionId = '123456789';
  const endpoint = 'https://endpoint';
  // topicUpdateTag is dependent on serviced-data mock.
  const topicUpdateTag = 'push-alerts-tag';

  let subscriptionTopics, subs;

  before(function () {
    this.timeout(5000);

    mocks.subs.begin();
    subs = require('application/server/services/subs');
  });

  after(() => {
    mocks.subs.end();
  });

  describe('create', () => {
    it('should create without error', (done) => {
      subs.create(subscriptionId, endpoint, (err, data) => {
        subscriptionTopics = data;
        expect(data).to.be.an('Array');
        done(err);
      });
    });

    it('should error with duplicate subscriptionId', (done) => {
      subs.create(subscriptionId, endpoint, (err) => {
        expect(err).to.be.an('Error');
        done();
      });
    });

    it('should error with bad subscriptionId', (done) => {
      subs.create(null, endpoint, (err) => {
        expect(err).to.be.an('Error');
        done();
      });
    });

    it('should error with bad endpoint', (done) => {
      subs.create(subscriptionId.substring(2, 6), null, (err) => {
        expect(err).to.be.an('Error');
        done();
      });
    });
  });

  describe('read', () => {
    it('should read without any subscriptionId', (done) => {
      subs.read(null, function (err, data) {
        expect(data).to.be.an('Array');
        done(err);
      });
    });

    it('should read with a subscriptionId', (done) => {
      subs.read(subscriptionId, (err, data) => {
        expect(data).to.eql(subscriptionTopics);
        done(err);
      });
    });
  });

  // NOTE: Relies on 'create' to be run first to supply subscriptionTopics.
  describe('update', () => {
    const newId = subscriptionId + '-001';

    it('should error with bad subscriptionId', (done) => {
      subs.update(null, subscriptionTopics, endpoint, null, (err) => {
        expect(err).to.be.an('Error');
        done();
      });
    });

    it('should update a subscriptionId', (done) => {
      const theSubs = subs.getSubscriptions();
      let updates;

      subs.update(subscriptionId, null, null, newId, (err) => {
        if (err) {
          done(err);
        }

        updates = Object.keys(theSubs).filter((key) => {
          return key === newId;
        });

        expect(updates.length).to.equal(1);
        expect(updates[0]).to.equal(newId);
        expect(theSubs[newId].subscriptionId).to.equal(newId);

        // set the subscriptionId back
        subs.update(newId, null, null, subscriptionId, (err) => {
          if (err) {
            done(err);
          }

          updates = Object.keys(theSubs).filter((key) => {
            return key === subscriptionId;
          });

          expect(updates.length).to.equal(1);
          expect(updates[0]).to.equal(subscriptionId);
          expect(theSubs[subscriptionId].subscriptionId).to.equal(subscriptionId);

          done();
        });
      });
    });

    it('should fail to update a subscriptionId if newId exists', (done) => {
      const theSubs = subs.getSubscriptions();

      // Add the duplicate.
      theSubs[newId] = {
        subscriptionId: newId,
        endpoint: 'testendpoint'
      };

      subs.update(subscriptionId, null, null, newId, (err) => {
        if (!err) {
          done(new Error('did not get expected duplicate error'));
        }
        delete theSubs[newId];
        done();
      });
    });

    it('should update a topic', (done) => {
      // establish precondition
      const theSubs = subs.getSubscriptions();
      Object.keys(theSubs).forEach((key) => {
        expect(theSubs[key].topics).to.be.an('Array').that.has.length.above(0);
        theSubs[key].topics.forEach((topic) => {
          delete topic.subscribed;
        });
      });

      var updates = subscriptionTopics.filter((topic) => {
        return topic.tag === topicUpdateTag;
      });
      expect(updates).to.have.length(1);
      updates[0].subscribed = true;

      subs.update(subscriptionId, updates, endpoint, null, (err, data) => {
        const updated = data.filter(topic => topic.tag === topicUpdateTag);
        const notUpdated = data.filter(topic => topic.tag !== topicUpdateTag);

        expect(updated).to.have.length(1);
        expect(updated[0]).to.have.property('subscribed').that.is.true;
        notUpdated.forEach((topic) => {
          expect(topic).to.not.have.property('subscribed');
        });

        done(err);
      });
    });
  });

  describe('delete', () => {
    it('should error on bad subscriptionId', (done) => {
      subs.delete(null, (err) => {
        expect(err).to.be.an('Error');
        done();
      });
    });

    it('should remove a subscription on delete', (done) => {
      const theSubs = subs.getSubscriptions();
      expect(theSubs[subscriptionId]).to.be.an('object');

      subs.delete(subscriptionId, (err) => {
        expect(theSubs[subscriptionId]).to.be.undefined;
        done(err);
      });
    });
  });
});
