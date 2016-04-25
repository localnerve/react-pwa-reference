/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Environment specific configuration for Flux-React-Example-Data (FRED)
 * FRED is the main data service of this example app.
 * Just one versionable endpoint for the app.
 *   Other endpoints are defined in the main response.
 *
 * Environment variables can override the following:
 *   FRED_URL - The full url to the resource manifest
 *   FRED_MEDIATYPE - The media type to Accept
 *   FRED_CONTENTENCODING - The encoding of the content
 *   FRED_BRANCH - A 'ref' parameter added to the FRED_URL.
 *     For GH, this changes the commit/branch/tag to query from
 *     (default is the repo default branch)
 */
'use strict';

var qs = require('querystring');

/***
 * Environment specific FRED_BRANCH name defaults.
 */
var branches = {
  development: 'development',
  production: 'master'
};

/**
 * Get the FRED_URL configuration value.
 * This is the single service URL endpoint where all app data resources come from.
 * Defaults to github api resources.json url from example FRED repo.
 *
 * @returns {String} The FRED_URL configuration value.
 */
function FRED_URL () {
  return process.env.FRED_URL ||
    'https://api.github.com/repos/localnerve/flux-react-example-sw-data/contents/resources.json';
}

/**
 * Get the FRED_MEDIATYPE configuration value.
 * This is the mediatype that accompanies the FRED_URL
 * Defaults to the current GH json media type.
 *
 * @returns {String} The FRED_MEDIATYPE configuration value.
 */
function FRED_MEDIATYPE () {
  return process.env.FRED_MEDIATYPE || 'application/vnd.github.v3+json';
}

/**
 * Get the FRED_CONTENTENCODING configuration value.
 * This is the content encoding of the media type.
 * Defaults to the v3 GH content encoding.
 * This value is consumed by a NodeJS Buffer.
 * @see https://developer.github.com/v3/repos/contents/
 * @see https://nodejs.org/api/buffer.html#buffer_new_buffer_str_encoding
 */
function FRED_CONTENTENCODING () {
  return process.env.FRED_CONTENTENCODING || 'base64';
}

/**
 * Get the FRED_BRANCH configuration value.
 * This is the FRED service version. Different GH branch
 *   can give a totally different resposne structure.
 * Defaults to environment specific branch default values.
 *
 * @returns {String} The FRED_BRANCH configuration value.
 */
function FRED_BRANCH (env) {
  return process.env.FRED_BRANCH || branches[env];
}

/**
 * Add the FRED_BRACH to the given url by environment.
 *
 * @param {String} url - The url to add the QS to.
 * @param {String} env - The node environment value.
 * @returns {String} The given url with a QS that defines the FRED_BRANCH.
 */
function addBranch (url, env) {
  return url +'?' + qs.stringify({ ref: FRED_BRANCH(env) });
}

/**
 * Make the data configuration object.
 *
 * @param {Object} nconf - The nconfig object.
 * @returns {Object} The data configuration object.
 */
function makeConfig (nconf) {
  var env = nconf.get('NODE_ENV');

  return {
    FRED: {
      mainResource: 'routes',

      /**
       * @see addBranch
       * @see FRED_URL
       */
      url: function () {
        return addBranch(FRED_URL(), env);
      },

      /**
       * @see FRED_MEDIATYPE
       */
      mediaType: FRED_MEDIATYPE,

      /**
       * @see FRED_CONTENTENCODING
       */
      contentEncoding: FRED_CONTENTENCODING,

      /**
       * @see addBranch
       */
      branchify: function (url) {
        return addBranch(url, env);
      }
    },

    defaults: {
      pageName: 'home'
    }
  };
}

module.exports = makeConfig;
