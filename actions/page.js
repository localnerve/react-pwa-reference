/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

var debug = require('debug')('Example:PageAction');

/**
 * The compound action dispatch associated with each page action.
 *
 * @param {Object} context - The fluxible action context.
 * @param {String} resource - The content resource name.
 * @param {String} title - The page title.
 * @param {Object} data - The content data.
 */
function dispatchActions (context, resource, title, data) {
  context.dispatch('RECEIVE_PAGE_CONTENT', {
    resource: resource,
    data: data
  });

  context.dispatch('UPDATE_PAGE_TITLE', {
    title: title
  });
}

/**
 * Perform the service request for the page action.
 *
 * @param {Object} context - The fluxible action context.
 * @param {Object} payload - The action payload.
 * @param {String} payload.resource - The name of the content resource.
 * @param {String} payload.pageTitle - The page title.
 * @param {Function} done - The callback to execute on request completion.
 */
function serviceRequest (context, payload, done) {
  debug('Page service request start');

  context.service.read('page', payload, {}, function (err, data) {
    debug('Page service request complete', data);

    if (err) {
      return done(err);
    }

    if (!data) {
      debug('no data found', payload.resource);

      var noData = new Error('Page not found');
      noData.statusCode = 404;
      return done(noData);
    }

    dispatchActions(context, payload.resource, payload.pageTitle, data);

    return done();
  });
}

/**
 * The page action.
 *
 * @param {Object} context - The fluxible action context.
 * @param {Object} payload - The action payload.
 * @param {String} payload.resource - The name of the content resource.
 * @param {String} payload.pageTitle - The page title.
 * @param {Function} done - The callback to execute on action completion.
 */
function page (context, payload, done) {
  var data = context.getStore('ContentStore').get(payload.resource);

  if (data) {
    debug('Found '+payload.resource+' in cache');
    dispatchActions(context, payload.resource, payload.pageTitle, data);
    return done();
  }

  serviceRequest(context, payload, done);
}

module.exports = page;
