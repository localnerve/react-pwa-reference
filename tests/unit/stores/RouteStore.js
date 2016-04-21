/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it, beforeEach */
'use strict';

var expect = require('chai').expect;
var RouteStore = require('../../../stores/RouteStore').RouteStore;
var routesResponseFixture = require('../../fixtures/routes-response');
var helperTests = require('../../utils/tests');
var transformer = require('../../../utils').createFluxibleRouteTransformer({
  actions: require('../../../actions/interface')
});

describe('Route store', function () {
  var routesResponse, storeInstance;

  beforeEach(function () {
    storeInstance = new RouteStore();
  });

  it('should instantiate correctly', function () {
    expect(storeInstance).to.be.an('object');
    expect(storeInstance._handleReceiveRoutes).to.be.a('function');
    expect(storeInstance.dehydrate).to.be.a('function');
    expect(storeInstance.rehydrate).to.be.a('function');
  });

  describe('with routes', function () {
    beforeEach(function () {
      // clone the routes-response fixture data
      routesResponse = JSON.parse(JSON.stringify(routesResponseFixture));
    });

    it('should dehydrate routes to json', function () {
      storeInstance._handleReceiveRoutes(transformer.jsonToFluxible(routesResponse));
      var state = storeInstance.dehydrate();
      expect(state.routes).to.eql(routesResponse);
    });

    it('should rehydrate to fluxible routes', function () {
      storeInstance.rehydrate({ routes: routesResponse });

      helperTests.testTransform(
        expect, storeInstance._routes, transformer.jsonToFluxible(routesResponse)
      );
    });
  });
});
