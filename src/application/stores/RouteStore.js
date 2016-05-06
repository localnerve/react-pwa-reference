/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Extend the fluxible route store so routes can have action functions.
 * Just de/rehydate the functions.
 */
import { RouteStore as FluxibleRouteStore } from 'fluxible-router';
import inherits from 'inherits';
import { createFluxibleRouteTransformer } from 'utils';
import actions from '../actions/interface';

const transformer = createFluxibleRouteTransformer({ actions });

/**
 * Creates a RouteStore.
 *
 * @class
 */
export function RouteStore () {
  FluxibleRouteStore.apply(this, arguments);
}

inherits(RouteStore, FluxibleRouteStore);

RouteStore.storeName = FluxibleRouteStore.storeName;
RouteStore.handlers = FluxibleRouteStore.handlers;

/**
 * Dehydrates this object to state.
 * Transforms routes to json.
 *
 * @returns {Object} The RouteStore represented as state.
 */
RouteStore.prototype.dehydrate = function dehydrate () {
  const state = FluxibleRouteStore.prototype.dehydrate.apply(this, arguments);
  state.routes = transformer.fluxibleToJson(state.routes);
  return state;
};

/**
 * Rehydrates this object from state.
 * Creates routes from json using transformer.
 */
RouteStore.prototype.rehydrate = function rehydrate (state) {
  state.routes = transformer.jsonToFluxible(state.routes);
  return FluxibleRouteStore.prototype.rehydrate.apply(this, arguments);
};

export default RouteStore;
