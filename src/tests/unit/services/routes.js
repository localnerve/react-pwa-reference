/**
 * Copyright (c) 2016 - 2022 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, before, after, it */
'use strict';

var expect = require('chai').expect;

var mocks = require('test/mocks');
var routesResponse = require('test/fixtures/routes-response');

describe('routes service', function () {
  var routes;

  before(function () {
    this.timeout(5000);

    mocks.serviceData.begin();
    routes = require('application/server/services/routes');
  });

  after(function () {
    mocks.serviceData.end();
  });

  describe('object', function () {
    it('should have name and read members', function () {
      expect(routes.name).to.be.a('string');
      expect(routes.read).to.be.a('function');
    });
  });

  describe('read', function () {
    it('should return a valid response', function (done) {
      routes.read(null, null, { resource: 'routes' }, null, function (err, data) {
        if (err) {
          done(err);
        }
        expect(data).to.be.an('object');
        expect(JSON.stringify(routesResponse.home)).to.equal(JSON.stringify(data.home));
        done();
      });
    });
  });
});
