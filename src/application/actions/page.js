/**
 * Copyright (c) 2016 - 2018 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import debugLib from 'debug';

const debug = debugLib('actions:page');

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

      const noData = new Error('Page not found');
      noData.statusCode = 404;
      return done(noData);
    }

    context.dispatch('RECEIVE_PAGE_CONTENT', {
      resource: payload.resource,
      data: data
    });

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
export function page (context, payload, done) {
  const data = context.getStore('ContentStore').get(payload.resource);

  if (data) {
    debug(`Found ${payload.resource} in cache`);

    context.dispatch('RECEIVE_PAGE_CONTENT', {
      resource: payload.resource,
      data: data
    });

    return done();
  }

  serviceRequest(context, payload, done);
}

export default page;
