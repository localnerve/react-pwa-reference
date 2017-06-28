/**
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it */

import { expect } from 'chai';
import syncable from 'utils/syncable';

describe('syncable', () => {
  it('should expose expected operations', () => {
    expect(syncable).to.respondTo('push');
    expect(syncable).to.respondTo('contact');
    expect(syncable).to.have.property('ops').that.is.an('object')
      .that.is.not.empty;
    expect(syncable).to.have.property('types').that.is.an('object')
      .that.is.not.empty;
    expect(syncable).to.have.property('propertyName').that.is.a('string')
      .that.is.not.empty;
  });

  describe('push', () => {
    it('should do nothing for a bad input', () => {
      expect(syncable.push(null)).to.be.null;
    });

    it('should create a fallback property for push', () => {
      const test = {};
      const result = syncable.push(test);

      expect(result._fallback).to.have.property('type');
      expect(result._fallback.type).to.equal('push');
    });
  });

  describe('contact', () => {
    it('should do nothing for a bad input', () => {
      expect(syncable.contact(null)).to.be.null;
    });

    it('should create a fallback property for contact', () => {
      const test = {};
      const result = syncable.contact(test);

      expect(result._fallback).to.have.property('type');
      expect(result._fallback.type).to.equal('contact');
    });
  });
});
