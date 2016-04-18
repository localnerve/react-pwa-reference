/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, before, after, it */
'use strict';

var expect = require('chai').expect;
var mocks = require('../../mocks');

describe('page service', function () {
  var page;

  before(function () {
    mocks.serviceData.begin();
    page = require('../../../services/page');
  });

  after(function () {
    mocks.serviceData.end();
  });

  describe('object', function () {
    it('should have name and read members', function () {
      expect(page.name).to.be.a('string');
      expect(page.read).to.be.a('function');
    });
  });

  describe('read', function () {
    it('should return a valid response', function (done) {
      page.read(null, null, { resource: 'home' }, null, function (err, data) {
        if (err) {
          done(err);
        }
        expect(data).to.be.an('object');
        expect(data).to.have.property('models')
          .that.is.an('object');
        expect(data).to.have.property('content')
          .that.is.a('string');
        done();
      });
    });
  });
});
