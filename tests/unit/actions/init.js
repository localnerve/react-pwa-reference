/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it, beforeEach */
'use strict';

var expect = require('chai').expect;

var createMockActionContext = require('fluxible/utils').createMockActionContext;
var initAction = require('../../../actions/init').init;
var BackgroundStore = require('../../../stores/BackgroundStore').BackgroundStore;

describe('init action', function () {
  var context, params = {
      backgrounds: {
        serviceUrl: 'https://lorempixel.com',
        backgrounds: ['1', '2']
      }
    };

  // create the action context wired to BackgroundStore
  beforeEach(function () {
    context = createMockActionContext({
      stores: [ BackgroundStore ]
    });
  });

  it('should update the background store', function (done) {
    context.executeAction(initAction, params, function (err) {
      if (err) {
        return done(err);
      }

      var store = context.getStore(BackgroundStore);

      expect(store.getImageServiceUrl()).to.equal(params.backgrounds.serviceUrl);
      expect(Object.keys(store.backgroundUrls)).to.have.length(2);

      done();
    });
  });
});
