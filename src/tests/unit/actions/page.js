/**
 * Copyright (c) 2016 - 2018 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it, beforeEach */
'use strict';

var expect = require('chai').expect;

var createMockActionContext = require('fluxible/utils').createMockActionContext;
var MockService = require('fluxible-plugin-fetchr/utils/MockServiceManager');
var ContentStore = require('application/stores/ContentStore').ContentStore;
var pageAction = require('application/actions/page').page;
var serviceData = require('test/mocks/service-data');

describe('page action', function () {
  var calledService = 0;
  var context;
  var params = {
    resource: 'home',
    pageTitle: 'happy time home page'
  };

  beforeEach(function () {
    calledService = 0;
    context = createMockActionContext({
      stores: [ContentStore]
    });
    context.service = new MockService();
    context.service.setService('page', function (method, params, config, callback) {
      calledService++;
      serviceData.fetch(params, callback);
    });
  });

  it('should update the ContentStore', function (done) {
    context.executeAction(pageAction, params, function (err) {
      if (err) {
        return done(err);
      }

      var content = context.getStore(ContentStore).getCurrentPageContent();

      expect(calledService).to.equal(1);
      expect(content).to.be.a('string').and.not.be.empty;
      done();
    });
  });

  it('should use the ContentStore before making a service call',
    function (done) {
      var contentStore = context.getStore(ContentStore);

      // make sure content for params.resource is there
      if (!contentStore.get(params.resource)) {
        contentStore.contents[params.resource] =
          serviceData.createContent(params.resource);
      }

      context.executeAction(pageAction, params, function (err) {
        if (err) {
          return done(err);
        }

        expect(calledService).to.equal(0);
        done();
      });
    });

  it('should fail as expected', function (done) {
    context.executeAction(pageAction, {
      emulateError: true
    }, function (err) {
      if (err) {
        return done();
      }

      done(new Error('should have received an error'));
    });
  });

  it('should fail as expected with no data', function (done) {
    context.executeAction(pageAction, {
      noData: true
    }, function (err) {
      if (err) {
        return done();
      }

      done(new Error('should have received an error'));
    });
  });
});
