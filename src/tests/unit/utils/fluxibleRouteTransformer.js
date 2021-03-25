/**
 * Copyright (c) 2016 - 2021 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it, before, beforeEach */

import { expect } from 'chai';
import routesResponseFixture from 'test/fixtures/routes-response';
import { testTransform } from 'test/utils/tests';

import { getActions } from 'application/actions/interface';
import { createFluxibleRouteTransformer } from 'utils';
const transformer = createFluxibleRouteTransformer({
  actions: getActions()
});

import { RouteStore } from 'application/stores/RouteStore';
import { ContentStore } from 'application/stores/ContentStore';
import MockService from 'fluxible-plugin-fetchr/utils/MockServiceManager';
import { createMockActionContext } from 'fluxible/utils';

describe('transformers', () => {
  let jsonRoutes, fluxibleRoutes;
  let jsonToFluxible, fluxibleToJson;
  let context;
  const testKey = 'home';
  const testAction = 'page';
  const testResource = 'test';
  const mockError = new Error('mock');

  function createMockContext () {
    context = createMockActionContext({
      stores: [RouteStore, ContentStore]
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
    delete require.cache[require.resolve('test/fixtures/fluxible-routes')];
    fluxibleRoutes = require('test/fixtures/fluxible-routes');
  }

  before(() => {
    jsonToFluxible = transformer.jsonToFluxible;
    fluxibleToJson = transformer.fluxibleToJson;
  });

  beforeEach(() => {
    cloneFixtures();
  });

  describe('test fixtures', () => {
    beforeEach(() => {
      createMockContext();
    });

    it('json routes should be correct', () => {
      expect(jsonRoutes).to.be.an('object');
      expect(jsonRoutes[testKey].action).to.be.an('object');
    });

    it('fluxible routes should be correct', () => {
      expect(fluxibleRoutes).to.be.an('object');
      expect(fluxibleRoutes[testKey].action).to.be.a('function');
    });
  });

  describe('jsonToFluxible', () => {
    beforeEach(() => {
      createMockContext();
    });

    it('should transform json routes to fluxible routes', (done) => {
      const fluxibleRoutes = jsonToFluxible(jsonRoutes);

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

    it('should throw if an unknown action is specified', () => {
      jsonRoutes.home.action.name = 'unknown_action';

      expect(() => {
        jsonToFluxible(jsonRoutes);
      }).to.throw(Error, /not found/);
    });
  });

  describe('fluxibleToJson', () => {
    it('should transform fluxible routes to json routes', () => {
      const jsonRoutes = fluxibleToJson(fluxibleRoutes);

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

  describe('roundtrip', () => {
    beforeEach(() => {
      createMockContext();
    });

    it('should reproduce the json routes', () => {
      const roundtrip = fluxibleToJson(jsonToFluxible(jsonRoutes));
      cloneFixtures();
      expect(roundtrip).to.eql(jsonRoutes);
    });

    it('should reproduce the fluxible routes', (done) => {
      const roundtrip = jsonToFluxible(fluxibleToJson(fluxibleRoutes));
      cloneFixtures();

      testTransform(expect, roundtrip, fluxibleRoutes);

      // check that the output action is workable
      roundtrip[testKey].action(context, {}, done);
    });
  });
});
