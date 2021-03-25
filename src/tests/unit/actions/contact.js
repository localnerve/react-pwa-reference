/**
 * Copyright (c) 2016 - 2021 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it, beforeEach */

import { expect } from 'chai';
import { createMockActionContext } from 'fluxible/utils';
import MockService from 'fluxible-plugin-fetchr/utils/MockServiceManager';
import { ContactStore } from 'application/stores/ContactStore';
import { contact as contactAction } from 'application/actions/contact';
import serviceMail from 'test/mocks/service-mail';

describe('contact action', () => {
  let context;

  const fields = {
    name: 'alex',
    email: 'alex@test.domain',
    message: 'the truth about seafood is it\'s people'
  };

  function getContactData () {
    const store = context.getStore(ContactStore);
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

  beforeEach(() => {
    context = createMockActionContext({
      stores: [ ContactStore ]
    });
    context.service = new MockService();
    context.service.setService('contact', (method, params, body, config, callback) => {
      serviceMail.send(params, callback);
    });
  });

  it('should update the ContactStore with one field', (done) => {
    const partialFields = {
      email: fields.email
    };

    context.executeAction(contactAction, { fields: partialFields }, (err) => {
      if (err) {
        return done(err);
      }

      const data = getContactData();

      expect(data.fields.name).to.equal('');
      expect(data.fields.email).to.deep.equal(partialFields.email);
      expect(data.fields.message).to.equal('');
      expect(data.failure).to.be.false;

      done();
    });
  });

  it('should update the ContactStore with all fields', (done) => {
    populateStore((err) => {
      if (err) {
        return done(err);
      }

      const data = getContactData();

      expect(data.fields).to.deep.equal(fields);
      expect(data.failure).to.be.false;

      done();
    });
  });

  it('should send and clear the ContactStore when complete, success', (done) => {
    context.executeAction(contactAction, { fields: getFields(), complete: true }, (err) => {
      if (err) {
        return done(err);
      }

      const data = getContactData();

      expect(data.fields.name).to.equal('');
      expect(data.fields.email).to.equal('');
      expect(data.fields.message).to.equal('');
      expect(data.failure).to.be.false;

      done();
    });
  });

  it('should update the ContactStore and send when complete, failure', (done) => {
    populateStore((err) => {
      if (err) {
        return done(err);
      }

      const mockFields = getFields();
      mockFields.emulateError = true;

      context.executeAction(contactAction, { fields: mockFields, complete: true }, (err) => {
        if (err) {
          return done(err);
        }

        const data = getContactData();

        expect(data.fields).to.deep.equal(fields);
        expect(data.failure).to.be.true;

        done();
      });
    });
  });
});
