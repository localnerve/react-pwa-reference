/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global before, describe, it */
'use strict';

var expect = require('chai').expect;

describe('syncable', function () {
  var syncable;

  before(function () {
    syncable = require('../../../utils/syncable');
  });

  it('should expose expected operations', function () {
    expect(syncable).to.respondTo('push');
    expect(syncable).to.respondTo('contact');
    expect(syncable).to.have.property('ops').that.is.an('object')
      .that.is.not.empty;
    expect(syncable).to.have.property('types').that.is.an('object')
      .that.is.not.empty;
    expect(syncable).to.have.property('propertyName').that.is.a('string')
      .that.is.not.empty;
  });

  describe('push', function () {
    it('should do nothing for a bad input', function () {
      expect(syncable.push(null)).to.be.null;
    });

    it('should create a fallback property for push', function () {
      var test = {};
      var result = syncable.push(test);

      expect(result._fallback).to.have.property('type');
      expect(result._fallback.type).to.equal('push');
    });
  });

  describe('contact', function () {
    it('should do nothing for a bad input', function () {
      expect(syncable.contact(null)).to.be.null;
    });

    it('should create a fallback property for contact', function () {
      var test = {};
      var result = syncable.contact(test);

      expect(result._fallback).to.have.property('type');
      expect(result._fallback.type).to.equal('contact');
    });
  });
});
