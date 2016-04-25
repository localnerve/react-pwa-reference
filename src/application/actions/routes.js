/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

var debug = require('debug')('actions:routes');
var createFluxibleRouteTransformer = require('utils').createFluxibleRouteTransformer;

/**
 * The routes action.
 * This action is only executed on the server in this example to get
 *  primary application routes into app state. However, this action could be
 *  reused to retrieve or populate additional in-app routes later.
 * If routes are not passed in, it retrieves payload.resource from the 'routes' service.
 *
 * @param {Object} context - The fluxible action context.
 * @param {Object} payload - The action payload.
 * @param {Function} [payload.transform] - An optional custom route transformer.
 * @param {Object} [payload.routes] - Optional routes to add to the app without a service request.
 * @param {String} payload.resource - The name of the routes resource to retrieve with a service request.
 */
function routes (context, payload, done) {
  var transformer = (typeof payload.transform === 'function' ?
        payload.transform : createFluxibleRouteTransformer({
          actions: require('./interface')
        }).jsonToFluxible);

  if (payload.routes) {
    var fluxibleRoutes = payload.routes;

    if (payload.transform) {
      debug('transforming routes');

      fluxibleRoutes = transformer(payload.routes);
    }

    context.dispatch('RECEIVE_ROUTES', fluxibleRoutes);
    return done();
  }

  debug('Routes request start');
  context.service.read('routes', payload, {}, function (err, routes) {
    debug('Routes request complete');

    if (err) {
      return done(err);
    }

    var fluxibleRoutes = transformer(routes);
    context.dispatch('RECEIVE_ROUTES', fluxibleRoutes);
    done(null, fluxibleRoutes);
  });
}

module.exports = routes;
