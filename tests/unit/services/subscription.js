/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, before, after, it */
'use strict';

var expect = require('chai').expect;
var mocks = require('../../mocks');

describe('subscription service', function () {
  var subscription;

  before(function () {
    mocks.serviceSubscription.begin();
    subscription = require('../../../services/subscription');
  });

  after(function () {
    mocks.serviceSubscription.end();
  });

  function subCall (method, done) {
    var args = [];
    if (method === 'read' || method === 'delete') {
      args.push(
        null, null, {}, null
      );
    } else {
      args.push(
        null, null, {}, {}, null
      );
    }
    args.push(function (err) {
      if (err) {
        return done(err);
      }
      done();
    });
    subscription[method].apply(subscription, args);
  }

  describe('object', function () {
    it('should have name and create members', function () {
      expect(subscription.name).to.be.a('string');
      expect(subscription.create).to.be.a('function');
      expect(subscription.read).to.be.a('function');
      expect(subscription.update).to.be.a('function');
      expect(subscription.delete).to.be.a('function');
    });
  });

  describe('create', function () {
    it('should return a valid response', function (done) {
      subCall('create', done);
    });
  });

  describe('read', function () {
    it('should return a valid response', function (done) {
      subCall('read', done);
    });
  });

  describe('update', function () {
    it('should return a valid response', function (done) {
      subCall('update', done);
    });
  });

  describe('delete', function () {
    it('should return a valid response', function (done) {
      subCall('delete', done);
    });
  });
});
