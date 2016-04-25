/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

var fetchOneParams;

module.exports = {
  mockReset: function () {
    fetchOneParams = undefined;
  },
  mockParams: function () {
    return fetchOneParams;
  },

  fetchOne: function (params, callback) {
    fetchOneParams = params;
    callback(null, 'fetch');
  },
  fetchMain: function (callback) {
    callback(null, 'fetch');
  },
  fetchAll: function (callback) {
    callback(null, 'fetch');
  },
  isManifestRequest: function (params) {
    return params.resource === 'routes';
  }
};
