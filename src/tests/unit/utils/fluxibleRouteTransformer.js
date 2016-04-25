/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it, before, beforeEach */
'use strict';

var expect = require('chai').expect;
var routesResponseFixture = require('../../fixtures/routes-response');
var fluxibleRoutesFixture = require('../../fixtures/fluxible-routes');
var helperTests = require('../../utils/tests');

var transformer = require('utils').createFluxibleRouteTransformer({
  actions: require('application/actions/interface')
});

var ApplicationStore = require('application/stores/ApplicationStore').ApplicationStore;
var ContentStore = require('application/stores/ContentStore').ContentStore;
var MockService = require('fluxible-plugin-fetchr/utils/MockServiceManager');
var createMockActionContext = require('fluxible/utils').createMockActionContext;

describe('transformers', function () {
  var jsonRoutes, fluxibleRoutes;
  var jsonToFluxible, fluxibleToJson;
  var context;
  var testKey = 'home';
  var testAction = 'page';
  var testResource = 'test';
  var mockError = new Error('mock');

  function createMockContext () {
    context = createMockActionContext({
      stores: [ApplicationStore, ContentStore]
    });
    context.service = new MockService();
    context.service.setService('routes', function (method, params, config, callback) {
      if (params.emulateError) {
        return callback(mockError);
      }
      callback(null, fluxibleRoutes);
    });
    context.service.setService('page', function (method, params, config, callback) {
      if (params.emulateError) {
        return callback(mockError);
      }
      callback(null, '<h1>Hello World</h1>');
    });
  }

  function cloneFixtures () {
    // clone routesResponse so we don't disrupt routes-response in require cache.
    jsonRoutes = JSON.parse(JSON.stringify(routesResponseFixture));
    // Fluxible routes are not serializable, that's the whole point.
    delete require.cache[require.resolve('../../fixtures/fluxible-routes')];
    fluxibleRoutesFixture = require('../../fixtures/fluxible-routes');
    fluxibleRoutes = fluxibleRoutesFixture;
  }

  before(function () {
    jsonToFluxible = transformer.jsonToFluxible;
    fluxibleToJson = transformer.fluxibleToJson;
  });

  beforeEach(function () {
    cloneFixtures();
  });

  describe('test fixtures', function () {
    beforeEach(function() {
      createMockContext();
    });

    it('json routes should be correct', function () {
      expect(jsonRoutes).to.be.an('object');
      expect(jsonRoutes[testKey].action).to.be.an('object');
    });

    it('fluxible routes should be correct', function () {
      expect(fluxibleRoutes).to.be.an('object');
      expect(fluxibleRoutes[testKey].action).to.be.a('function');
    });
  });

  describe('jsonToFluxible', function () {
    beforeEach(function () {
      createMockContext();
    });

    it('should transform json routes to fluxible routes', function (done) {
      var fluxibleRoutes = jsonToFluxible(jsonRoutes);

      // check output types
      expect(fluxibleRoutes).to.be.an('object');
      expect(fluxibleRoutes[testKey].action).to.be.a('function');

      // check that no keys are lost
      expect(Object.keys(jsonRoutes).length).to.equal(
        Object.keys(fluxibleRoutes).length
      );

      // check that the output action is workable
      fluxibleRoutes[testKey].action(context, { emulateError: true }, done);
    });

    it('should throw if an unknown action is specified', function () {
      jsonRoutes.home.action.name = 'unknown_action';

      expect(function() {
        jsonToFluxible(jsonRoutes);
      }).to.throw(Error, /not found/);
    });
  });

  describe('fluxibleToJson', function() {
    it('should transform fluxible routes to json routes', function () {
      var jsonRoutes = fluxibleToJson(fluxibleRoutes);

      // check output types
      expect(jsonRoutes).to.be.an('object');
      expect(jsonRoutes[testKey].action).to.be.an('object');

      // check that no keys are lost
      expect(Object.keys(fluxibleRoutes).length).to.equal(
        Object.keys(jsonRoutes).length
      );

      // check that action name and params are present
      expect(jsonRoutes[testKey].action.name).to.equal(testAction);
      expect(jsonRoutes[testKey].action.params).to.be.an('object');
      expect(jsonRoutes[testKey].action.params.resource).to.equal(testResource);
    });
  });

  describe('roundtrip', function () {
    beforeEach(function() {
      createMockContext();
    });

    it('should reproduce the json routes', function () {
      var roundtrip = fluxibleToJson(jsonToFluxible(jsonRoutes));
      cloneFixtures();
      expect(roundtrip).to.eql(jsonRoutes);
    });

    it('should reproduce the fluxible routes', function (done) {
      var roundtrip = jsonToFluxible(fluxibleToJson(fluxibleRoutes));
      cloneFixtures();

      helperTests.testTransform(expect, roundtrip, fluxibleRoutes);

      // check that the output action is workable
      roundtrip[testKey].action(context, {}, done);
    });
  });
});
