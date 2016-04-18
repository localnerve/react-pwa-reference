/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
 /* global before, after, describe, it */
'use strict';

var expect = require('chai').expect;
var mocks = require('../../../mocks');

describe('subs/index', function () {
  var subscriptionId = '123456789',
    endpoint = 'https://endpoint',
    // topicUpdateTag is dependent on serviced-data mock.
    topicUpdateTag = 'push-alerts-tag',
    subscriptionTopics,
    subs;

  before(function () {
    mocks.subs.begin();
    subs = require('../../../../services/subs');
  });

  after(function () {
    mocks.subs.end();
  });

  describe('create', function () {
    it('should create without error', function (done) {
      subs.create(subscriptionId, endpoint, function (err, data) {
        subscriptionTopics = data;
        expect(data).to.be.an('Array');
        done(err);
      });
    });

    it('should error with duplicate subscriptionId', function (done) {
      subs.create(subscriptionId, endpoint, function (err) {
        expect(err).to.be.an('Error');
        done();
      });
    });

    it('should error with bad subscriptionId', function (done) {
      subs.create(null, endpoint, function (err) {
        expect(err).to.be.an('Error');
        done();
      });
    });

    it('should error with bad endpoint', function (done) {
      subs.create(subscriptionId.substring(2, 6), null, function (err) {
        expect(err).to.be.an('Error');
        done();
      });
    });
  });

  describe('read', function () {
    it('should read without any subscriptionId', function (done) {
      subs.read(null, function (err, data) {
        expect(data).to.be.an('Array');
        done(err);
      });
    });

    it('should read with a subscriptionId', function (done) {
      subs.read(subscriptionId, function (err, data) {
        expect(data).to.eql(subscriptionTopics);
        done(err);
      });
    });
  });

  // NOTE: Relies on 'create' to be run first to supply subscriptionTopics.
  describe('update', function () {
    var newId = subscriptionId + '-001';

    it('should error with bad subscriptionId', function (done) {
      subs.update(null, subscriptionTopics, endpoint, null, function (err) {
        expect(err).to.be.an('Error');
        done();
      });
    });

    it('should update a subscriptionId', function (done) {
      var updates,
        theSubs = subs.getSubscriptions();

      subs.update(subscriptionId, null, null, newId, function(err) {
        if (err) {
          done(err);
        }

        updates = Object.keys(theSubs).filter(function (key) {
          return key === newId;
        });

        expect(updates.length).to.equal(1);
        expect(updates[0]).to.equal(newId);
        expect(theSubs[newId].subscriptionId).to.equal(newId);

        // set the subscriptionId back
        subs.update(newId, null, null, subscriptionId, function (err) {
          if (err) {
            done(err);
          }

          updates = Object.keys(theSubs).filter(function (key) {
            return key === subscriptionId;
          });

          expect(updates.length).to.equal(1);
          expect(updates[0]).to.equal(subscriptionId);
          expect(theSubs[subscriptionId].subscriptionId).to.equal(subscriptionId);

          done();
        });
      });
    });

    it('should fail to update a subscriptionId if newId exists', function (done) {
      var theSubs = subs.getSubscriptions();

      // Add the duplicate.
      theSubs[newId] = {
        subscriptionId: newId,
        endpoint: 'testendpoint'
      };

      subs.update(subscriptionId, null, null, newId, function (err) {
        if (!err) {
          done(new Error('did not get expected duplicate error'));
        }
        delete theSubs[newId];
        done();
      });
    });

    it('should update a topic', function (done) {
      // establish precondition
      var theSubs = subs.getSubscriptions();
      Object.keys(theSubs).forEach(function (key) {
        expect(theSubs[key].topics).to.be.an('Array').that.has.length.above(0);
        theSubs[key].topics.forEach(function (topic) {
          delete topic.subscribed;
        });
      });

      var updates = subscriptionTopics.filter(function (topic) {
        return topic.tag === topicUpdateTag;
      });
      expect(updates).to.have.length(1);
      updates[0].subscribed = true;

      subs.update(subscriptionId, updates, endpoint, null, function (err, data) {
        var updated = data.filter(function (topic) {
          return topic.tag === topicUpdateTag;
        });
        var notUpdated = data.filter(function (topic) {
          return topic.tag !== topicUpdateTag;
        });

        expect(updated).to.have.length(1);
        expect(updated[0]).to.have.property('subscribed').that.is.true;
        notUpdated.forEach(function (topic) {
          expect(topic).to.not.have.property('subscribed');
        });

        done(err);
      });
    });
  });

  describe('delete', function () {
    it('should error on bad subscriptionId', function (done) {
      subs.delete(null, function (err) {
        expect(err).to.be.an('Error');
        done();
      });
    });

    it('should remove a subscription on delete', function (done) {
      var theSubs = subs.getSubscriptions();
      expect(theSubs[subscriptionId]).to.be.an('object');

      subs.delete(subscriptionId, function (err) {
        expect(theSubs[subscriptionId]).to.be.undefined;
        done(err);
      });
    });
  });
});
