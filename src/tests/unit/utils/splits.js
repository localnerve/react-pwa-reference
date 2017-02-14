/**
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global before, describe, it */
'use strict';

var expect = require('chai').expect;

var createMockActionContext = require('fluxible/utils').createMockActionContext;
var splits = require('utils/splits').splitHandlers;

describe('splits', function () {
  it('should expose settings split', function () {
    expect(splits).to.respondTo('settings');
  });

  describe('settings', function () {
    var context,
      payload = {
        action: {
          name: 'settings'
        },
        component: 'settings'
      },
      action = function (context, payload, done) {
        expect(context).to.respondTo('dispatch');
        expect(context).to.respondTo('getStore');
        expect(context).to.respondTo('executeAction');
        if (payload.emulateError) {
          return done(new Error('mock'));
        }
        return done();
      };

    before(function () {
      context = createMockActionContext();
    });

    it('should resolve successfully', function (done) {
      splits.settings(context, payload, action).then(function () {
        done();
      }).catch(function (error) {
        done(error);
      });
    });

    it('should reject as expected', function (done) {
      payload.emulateError = true;

      function complete (error) {
        delete payload.emulateError;
        done(error);
      }

      splits.settings(context, payload, action).then(function () {
        complete(new Error('should have thrown an error'));
      }).catch(function () {
        complete();
      });
    });
  });
});
