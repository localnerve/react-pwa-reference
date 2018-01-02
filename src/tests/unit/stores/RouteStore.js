/**
 * Copyright (c) 2016 - 2018 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it, beforeEach */

import { expect } from 'chai';
import { RouteStore } from 'application/stores/RouteStore';
import { getActions } from 'application/actions/interface';
import { createFluxibleRouteTransformer } from 'utils';

import routesResponseFixture from 'test/fixtures/routes-response';
import { testTransform } from 'test/utils/tests';

const transformer = createFluxibleRouteTransformer({
  actions: getActions()
});

describe('Route store', () => {
  let routesResponse, storeInstance;

  beforeEach(() => {
    storeInstance = new RouteStore();
  });

  it('should instantiate correctly', () => {
    expect(storeInstance).to.be.an('object');
    expect(storeInstance._handleReceiveRoutes).to.be.a('function');
    expect(storeInstance.dehydrate).to.be.a('function');
    expect(storeInstance.rehydrate).to.be.a('function');
  });

  describe('with routes', () => {
    beforeEach(() => {
      // clone the routes-response fixture data
      routesResponse = JSON.parse(JSON.stringify(routesResponseFixture));
    });

    it('should dehydrate routes to json', () => {
      storeInstance._handleReceiveRoutes(transformer.jsonToFluxible(routesResponse));
      const state = storeInstance.dehydrate();
      expect(state.routes).to.eql(routesResponse);
    });

    it('should rehydrate to fluxible routes', () => {
      storeInstance.rehydrate({
        routes: routesResponse,
        currentNavigate: {
          url: '/bogus'
        }
      });

      testTransform(
        expect, storeInstance._routes, transformer.jsonToFluxible(routesResponse)
      );
    });
  });
});
