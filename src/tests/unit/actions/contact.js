/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it, beforeEach */
'use strict';

var expect = require('chai').expect;

var createMockActionContext = require('fluxible/utils').createMockActionContext;
var MockService = require('fluxible-plugin-fetchr/utils/MockServiceManager');
var ContactStore = require('application/stores/ContactStore').ContactStore;
var contactAction = require('application/actions/contact').contact;
var serviceMail = require('test/mocks/service-mail');

describe('contact action', function () {
  var context;

  var fields = {
    name: 'alex',
    email: 'alex@test.domain',
    message: 'the truth about seafood is it\'s people'
  };

  function getContactData () {
    var store = context.getStore(ContactStore);
    return {
      fields: store.getContactFields(),
      failure: store.getContactFailure()
    };
  }

  function getFields () {
    return JSON.parse(JSON.stringify(fields));
  }

  function populateStore (callback) {
    context.executeAction(contactAction, { fields: getFields() }, callback);
  }

  beforeEach(function () {
    context = createMockActionContext({
      stores: [ ContactStore ]
    });
    context.service = new MockService();
    context.service.setService('contact', function (method, params, body, config, callback) {
      serviceMail.send(params, callback);
    });
  });

  it('should update the ContactStore with one field', function (done) {
    var partialFields = {
      email: fields.email
    };

    context.executeAction(contactAction, { fields: partialFields }, function (err) {
      if (err) {
        return done(err);
      }

      var data = getContactData();

      expect(data.fields.name).to.equal('');
      expect(data.fields.email).to.deep.equal(partialFields.email);
      expect(data.fields.message).to.equal('');
      expect(data.failure).to.be.false;

      done();
    });
  });

  it('should update the ContactStore with all fields', function (done) {
    populateStore(function (err) {
      if (err) {
        return done(err);
      }

      var data = getContactData();

      expect(data.fields).to.deep.equal(fields);
      expect(data.failure).to.be.false;

      done();
    });
  });

  it('should send and clear the ContactStore when complete, success', function (done) {
    context.executeAction(contactAction, { fields: getFields(), complete: true }, function (err) {
      if (err) {
        return done(err);
      }

      var data = getContactData();

      expect(data.fields.name).to.equal('');
      expect(data.fields.email).to.equal('');
      expect(data.fields.message).to.equal('');
      expect(data.failure).to.be.false;

      done();
    });
  });

  it('should update the ContactStore and send when complete, failure', function (done) {
    populateStore(function (err) {
      if (err) {
        return done(err);
      }

      var mockFields = getFields();
      mockFields.emulateError = true;

      context.executeAction(contactAction, { fields: mockFields, complete: true }, function (err) {
        if (err) {
          return done(err);
        }

        var data = getContactData();

        expect(data.fields).to.deep.equal(fields);
        expect(data.failure).to.be.true;

        done();
      });
    });
  });
});
