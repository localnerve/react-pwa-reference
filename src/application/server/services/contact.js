/***
 * Copyright (c) 2016 - 2020 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * A Yahoo fetchr service definition for contact creation.
 */
import mail from './mail';
import error from './error';

export const name = 'contact';

/**
 * The create CRUD method definition.
 * Just directs work. Params are per Yahoo fetchr.
 *
 * @param {Object} req - Not used.
 * @param {String} resource - Not used.
 * @param {Object} params - The collected contact fields to send.
 * @param {Object} body - Not used.
 * @param {Object} config - Not used.
 * @param {Function} callback - The callback to execute on completion.
 */
export function create (req, resource, params, body, config, callback) {
  return mail.send(params, (err, data) => {
    callback(error(err), data);
  });
}

export default {
  name,
  create
};
