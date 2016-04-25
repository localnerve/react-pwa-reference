/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * A Yahoo fetchr service definition for a page request
 */
import data from './data';
import error from './error';

export const name = 'page';

/**
 * The read CRUD method definition.
 * Just directs work. Params are per Yahoo fetchr.
 *
 * @param {Object} req - Not used.
 * @param {String} resource - Not used.
 * @param {Object} params - The data fetch parameters.
 * @param {Object} config - Not used.
 * @param {Function} callback - The callback to execute on completion.
 */
export function read (req, resource, params, config, callback) {
  return data.fetch(params, (err, data) => {
    callback(error(err), data);
  });
}

export default {
  name,
  read
};
