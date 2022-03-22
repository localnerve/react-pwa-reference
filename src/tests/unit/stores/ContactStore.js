/**
 * Copyright (c) 2016 - 2022 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it, beforeEach */
'use strict';

var expect = require('chai').expect;
var ContactStore = require('application/stores/ContactStore').ContactStore;

describe('contact store', function () {
  var storeInstance;
  var fields = {
    name: 'alex',
    email: 'alex@test.domain',
    message: 'it\'s a wonderful life'
  };

  beforeEach(function () {
    storeInstance = new ContactStore();
  });

  it('should instantiate correctly', function () {
    expect(storeInstance).to.be.an('object');
    expect(storeInstance.name).to.equal('');
    expect(storeInstance.email).to.equal('');
    expect(storeInstance.message).to.equal('');
    expect(storeInstance.failure).to.equal(false);
  });

  it('should receive contact fields', function () {
    storeInstance.updateContactFields(fields);
    expect(storeInstance.name).to.equal(fields.name);
    expect(storeInstance.email).to.equal(fields.email);
    expect(storeInstance.message).to.equal(fields.message);
    expect(storeInstance.failure).to.equal(false);
  });

  it('should clear all contact fields implicitly', function () {
    storeInstance.updateContactFields(fields);
    storeInstance.updateContactFields({});
    expect(storeInstance.name).to.equal('');
    expect(storeInstance.email).to.equal('');
    expect(storeInstance.message).to.equal('');
    expect(storeInstance.failure).to.equal(false);
  });

  it('should clear all contact fields explicitly', function () {
    storeInstance.updateContactFields(fields);
    storeInstance.clearContactFields();
    expect(storeInstance.name).to.equal('');
    expect(storeInstance.email).to.equal('');
    expect(storeInstance.message).to.equal('');
    expect(storeInstance.failure).to.equal(false);
  });

  it('should receive one contact field', function () {
    storeInstance.updateContactFields({
      name: fields.name
    });
    expect(storeInstance.name).to.equal(fields.name);
    expect(storeInstance.email).to.equal('');
    expect(storeInstance.message).to.equal('');
    expect(storeInstance.failure).to.equal(false);
  });

  it('should clear one contact field', function () {
    storeInstance.updateContactFields(fields);
    storeInstance.updateContactFields({
      name: fields.name,
      message: fields.message
    });
    expect(storeInstance.name).to.equal(fields.name);
    expect(storeInstance.email).to.equal('');
    expect(storeInstance.message).to.equal(fields.message);
    expect(storeInstance.failure).to.equal(false);
  });

  it('should get contact fields', function () {
    storeInstance.updateContactFields(fields);
    expect(storeInstance.getContactFields()).to.deep.equal(fields);
  });

  it('should get contact failure', function () {
    storeInstance.setContactFailure();
    expect(storeInstance.getContactFailure()).to.equal(true);
  });

  it('should dehydrate', function () {
    storeInstance.updateContactFields(fields);
    var state = storeInstance.dehydrate();

    expect(state.name).to.equal(fields.name);
    expect(state.email).to.equal(fields.email);
    expect(state.message).to.equal(fields.message);
    expect(storeInstance.failure).to.equal(false);
  });

  it('should rehydrate', function () {
    var state = {
      name: fields.name,
      email: fields.email,
      message: fields.message,
      failure: false
    };

    storeInstance.rehydrate(state);

    expect(storeInstance.name).to.equal(state.name);
    expect(storeInstance.email).to.equal(state.email);
    expect(storeInstance.message).to.equal(state.message);
    expect(storeInstance.failure).to.equal(state.failure);
  });
});
