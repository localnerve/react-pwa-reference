/***
 * Copyright (c) 2016 - 2018 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import debugLib from 'debug';
import syncable from 'utils/syncable';

const debug = debugLib('actions:contact');

/**
 * Perform the contact service request.
 *
 * @param {Object} context - The fluxible action context.
 * @param {Object} fields - The contact fields.
 * @param {String} fields.email - The contact replyTo email address.
 * @param {Function} done - The callback to execute on completion.
 */
function serviceRequest (context, fields, done) {
  context.service.create(
    'contact',
    syncable.contact(fields, fields.email), {}, {}, (err) => {
      if (err) {
        debug('dispatching CREATE_CONTACT_FAILURE');
        context.dispatch('CREATE_CONTACT_FAILURE', fields);
        return done();
      }

      debug('dispatching CREATE_CONTACT_SUCCESS');
      context.dispatch('CREATE_CONTACT_SUCCESS', fields);
      done();
    }
  );
}

/**
 * Perform the contact action.
 *
 * @param {Object} context - The fluxible context.
 * @param {Object} payload - The action payload.
 * @param {Object} payload.fields - The contact fields.
 * @param {Boolean} payload.complete - Flag indicating contact field gathering is complete.
 * @param {Function} done - The callback to execute on completion.
 */
export function contact (context, payload, done) {
  debug('dispatching UPDATE_CONTACT_FIELDS', payload.fields);
  context.dispatch('UPDATE_CONTACT_FIELDS', payload.fields);

  if (!payload.complete) {
    return done();
  }

  serviceRequest(context, payload.fields, done);
}

export default contact;
