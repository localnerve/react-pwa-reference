/**
 * Copyright (c) 2016 - 2019 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import debugLib from 'debug';
import { createFluxibleRouteTransformer } from 'utils';

const debug = debugLib('actions:routes');

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
export function routes (context, payload, done) {
  // This is done late in case routes (this) in interface, TODO: revisit.
  const actions = require('application/actions/interface').getActions();

  const transformer = (typeof payload.transform === 'function' ?
    payload.transform : createFluxibleRouteTransformer({
      actions
    }).jsonToFluxible);

  if (payload.routes) {
    let fluxibleRoutes = payload.routes;

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

    const fluxibleRoutes = transformer(routes);
    context.dispatch('RECEIVE_ROUTES', fluxibleRoutes);
    done(null, fluxibleRoutes);
  });
}

export default routes;
