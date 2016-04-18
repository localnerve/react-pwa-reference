/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global before, beforeEach, describe, it */
'use strict';

var expect = require('chai').expect;

describe('property', function () {
  var property;

  before(function () {
    property = require('../../../utils/property');
  });

  it('should expose expected operations', function () {
    expect(property).to.respondTo('find');
  });

  describe('find', function () {
    var propertyFind;
    var target = {
      test: 'found'
    };
    var fixture = {
      test: 'false',
      test2: false,
      test3: {
        test: 'str'
      },
      test4: {
      },
      test5: {
        test: 1
      },
      test6: [{
        test: 0,
        test1: {
          test: [{
          }]
        }
      }, [{
        test: {
          test: {
          }
        }
      }]
      ]
    };

    function cloneFixture () {
      return JSON.parse(JSON.stringify(fixture));
    }

    before(function () {
      propertyFind = property.find.bind(null, 'target');
    });

    it('should return undefined if bad input', function () {
      expect(property.find()).to.be.undefined;
      expect(property.find('', {})).to.be.undefined;
      expect(propertyFind(null)).to.be.undefined;
      expect(propertyFind('string')).to.be.undefined;
      expect(propertyFind(false)).to.be.undefined;
    });

    it('should return undefined if not found', function () {
      expect(propertyFind({})).to.be.undefined;
      expect(propertyFind(fixture)).to.be.undefined;
    });

    describe('target 1', function () {
      var copy;

      beforeEach(function () {
        copy = cloneFixture();
        copy.test6[0].test1.test[0].target = target;
      });

      it('should find target', function () {
        expect(propertyFind(copy)).to.eql(target);
      });

      it('should find and remove target if specified', function () {
        var result = propertyFind(copy, true);

        expect(result).to.eql(target);
        expect(copy.test6[0].test1.test[0]).to.be.an('object').that.is.empty;
      });
    });

    describe('target 2', function () {
      var copy;

      beforeEach(function () {
        copy = cloneFixture();
        copy.test6[0].test1.test[0].target = target;
      });

      it('should find target', function () {
        expect(propertyFind(copy)).to.eql(target);
      });

      it('should find and remove target if specified', function () {
        var result = propertyFind(copy, true);

        expect(result).to.eql(target);
        expect(copy.test6[0].test1.test[0]).to.be.an('object').that.is.empty;
      });
    });

    describe('target 3', function () {
      var copy;

      beforeEach(function () {
        copy = cloneFixture();
        copy.test4.target = target;
      });

      it('should find target', function () {
        expect(propertyFind(copy)).to.eql(target);
      });

      it('should find and remove target if specified', function () {
        var result = propertyFind(copy, true);

        expect(result).to.eql(target);
        expect(copy.test4).to.be.an('object').that.is.empty;
      });
    });

    describe('target 4', function () {
      var copy;

      beforeEach(function () {
        copy = cloneFixture();
        copy.target = target;
      });

      it('should find target', function () {
        expect(propertyFind(copy)).to.eql(target);
      });

      it('should find and remove target if specified', function () {
        var result = propertyFind(copy, true);

        expect(result).to.eql(target);
        expect(copy.target).to.be.undefined;
      });
    });
  });
});
