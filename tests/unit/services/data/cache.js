/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
 /* global beforeEach, describe, it */
'use strict';

var expect = require('chai').expect;

var cache = require('../../../../services/data/cache');
var cacheResources = require('../../../fixtures/cache-resources');

describe('data/cache', function () {
  var models = cacheResources.models;

  describe('put', function () {
    it('should throw if undefined params supplied', function () {
      expect(function () {
        cache.put(undefined, false);
      }).to.throw(Error);
    });

    it('should throw if empty params supplied', function () {
      expect(function () {
        cache.put(cacheResources.nothing, true);
      }).to.throw(Error);
    });

    it('should throw if no data supplied', function () {
      expect(function () {
        cache.put(cacheResources.noData, cacheResources.noData.data);
      }).to.throw(Error);
    });

    it('should throw if bad format supplied', function () {
      expect(function () {
        cache.put(cacheResources.badFormat, cacheResources.badFormat.data);
      }).to.throw(Error);
    });

    it('should format json if no format supplied', function () {
      cache.put(cacheResources.noFormat, cacheResources.noFormat.data);

      var res = cache.get(cacheResources.noFormat.resource);

      expect(res).to.be.an('object');
      expect(res).to.have.property('models', undefined);
      expect(res).to.have.property('content')
        .that.deep.equals(cacheResources.jsonData.test);
    });

    it('should put models as expected', function () {
      cache.put(models, models.data);

      var res = cache.get(models.resource);

      expect(res).to.be.an('object');
      expect(res).to.have.property('models', undefined);
      expect(res).to.have.property('content')
        .that.deep.equals(cacheResources.validModels.models);
    });

    it('should put valid data with no models', function () {
      var validNone = cacheResources.markup.validNone;

      cache.put(validNone, validNone.data);

      var res = cache.get(validNone.resource);

      expect(res).to.be.an('object');
      expect(res).to.have.property('models', undefined);
      expect(res).to.have.property('content')
        .that.deep.equals(cacheResources.markupData);
    });

    it('should put valid data with single, valid model', function () {
      var validSingle = cacheResources.markup.validSingle;

      cache.put(validSingle, validSingle.data);

      var res = cache.get(validSingle.resource);

      expect(res).to.be.an('object');
      expect(res).to.have.property('models')
        .that.deep.equals({
          ValidModel1: cacheResources.validModels.models.ValidModel1
        });
      expect(res).to.have.property('content')
        .that.deep.equals(cacheResources.markupData);
    });

    it('should put valid data with multiple, valid model', function () {
      var validMulti = cacheResources.markup.validMulti;

      cache.put(validMulti, validMulti.data);

      var res = cache.get(validMulti.resource);

      expect(res).to.be.an('object');
      expect(res).to.have.property('models')
        .that.deep.equals(cacheResources.validModels.models);
      expect(res).to.have.property('content')
        .that.deep.equals(cacheResources.markupData);
    });

    it('should have undefined model if invalid model reference supplied', function () {
      var invalid = cacheResources.markup.invalid;

      cache.put(invalid, invalid.data);

      var res = cache.get(invalid.resource);

      expect(res).to.be.an('object');
      expect(res).to.have.deep.property('models.InvalidModel', undefined);
      expect(res).to.have.property('content')
        .that.deep.equals(cacheResources.markupData);
    });
  });

  describe('get', function () {
    it('should return undefined for miss', function () {
      expect(cache.get('bogus')).to.be.undefined;
    });

    it('should return valid for hit', function () {
      var res = cache.get(models.resource);

      expect(res).to.be.an('object');
      expect(res).to.have.property('models', undefined);
      expect(res).to.have.property('content')
        .that.deep.equals(cacheResources.validModels.models);
    });
  });

  describe('find', function () {
    var res;
    var notFoundValue = 'notFound';

    // assert 'put' cache state preconditions exist.
    beforeEach('find', function () {
      res = cache.get(cacheResources.noFormat.resource);
      expect(res.content.resource).to.equal(cacheResources.jsonData.test.resource);
    });

    it('should return undefined if bad input', function () {
      expect(cache.find()).to.be.undefined;
    });

    it('should find valid item', function () {
      var result = cache.find(cacheResources.jsonData.test.resource);
      expect(result).to.eql(res.content);
    });

    it('should not find valid item', function () {
      var result = cache.find(notFoundValue);
      expect(result).to.be.undefined;
    });
  });
});
