/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it, beforeEach */
'use strict';

var expect = require('chai').expect;

var createMockActionContext = require('fluxible/utils').createMockActionContext;
var MockService = require('fluxible-plugin-fetchr/utils/MockServiceManager');

var RouteStore = require('../../../stores/RouteStore').RouteStore;
var routes = require('../../../actions/routes');
var routesResponse = require('../../fixtures/routes-response');
var transformer = require('../../../utils').createFluxibleRouteTransformer({
  actions: require('../../../actions/interface')
});
var testUtils = require('../../utils/tests');

describe('routes action', function () {
  var context;
  var response;
  var testPage = 'home';

  function checkTestPage() {
    var pages = context.getStore(RouteStore).getRoutes();

    expect(pages).to.be.an('object');
    expect(pages).to.not.be.empty;
    expect(pages[testPage]).to.be.an('object');
  }

  // create the action context wired to RouteStore
  beforeEach(function () {
    context = createMockActionContext({
      stores: [RouteStore]
    });
  });

  describe('with routes payload', function () {
    var params = {
      routes: null
    };

    // clone the response fixture, set it to a fluxible state.
    beforeEach(function () {
      response = transformer.jsonToFluxible(
        JSON.parse(JSON.stringify(routesResponse))
      );
      params.routes = response;
    });

    it('should update the RouteStore', function (done) {
      context.executeAction(routes, params, function (err) {
        if (err) {
          return done(err);
        }

        checkTestPage();
        done();
      });
    });

    it('should use a custom transformer if supplied', function (done) {
      var custom;

      params.transform = function (input) {
        custom = input;
        return custom;
      };

      context.executeAction(routes, params, function (err) {
        if (err) {
          done(err);
        }

        expect(custom).to.be.an('object');
        checkTestPage();
        done();
      });
    });
  });

  describe('without routes payload', function () {
    var fluxibleRoutesFixture;

    // Setup the context.service
    // clone the response fixture, set it to a wire state.
    beforeEach(function () {
      response = JSON.parse(JSON.stringify(routesResponse));
      fluxibleRoutesFixture = transformer.jsonToFluxible(response);

      context.service = new MockService();
      context.service.setService('routes', function (method, params, config, callback) {
        if (params.emulateError) {
          return callback(new Error('mock'));
        }
        callback(null, response);
      });
    });

    it('should update the ApplicationStore', function (done) {
      context.executeAction(routes, {}, function (err, fluxibleRoutes) {
        if (err) {
          return done(err);
        }

        testUtils.testTransform(expect, fluxibleRoutes, fluxibleRoutesFixture);
        checkTestPage();
        done();
      });
    });

    it('should throw an error if the service does', function (done) {
      context.executeAction(routes, { emulateError: true }, function (err) {
        expect(err).to.be.instanceof(Error);
        done();
      });
    });
  });
});
