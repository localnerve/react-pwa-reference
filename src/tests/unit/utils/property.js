/**
 * Copyright (c) 2016 - 2019 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global beforeEach, describe, it */

import { expect } from 'chai';
import property from 'utils/property';

describe('property', () => {
  it('should expose expected operations', () => {
    expect(property).to.respondTo('find');
  });

  describe('find', () => {
    const propertyFind = property.find.bind(null, 'target');
    const target = {
      test: 'found'
    };
    const fixture = {
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

    it('should return undefined if bad input', () => {
      expect(property.find()).to.be.undefined;
      expect(property.find('', {})).to.be.undefined;
      expect(propertyFind(null)).to.be.undefined;
      expect(propertyFind('string')).to.be.undefined;
      expect(propertyFind(false)).to.be.undefined;
    });

    it('should return undefined if not found', () => {
      expect(propertyFind({})).to.be.undefined;
      expect(propertyFind(fixture)).to.be.undefined;
    });

    describe('target 1', () => {
      let copy;

      beforeEach(() => {
        copy = cloneFixture();
        copy.test6[0].test1.test[0].target = target;
      });

      it('should find target', () => {
        expect(propertyFind(copy)).to.eql(target);
      });

      it('should find and remove target if specified', () => {
        const result = propertyFind(copy, true);

        expect(result).to.eql(target);
        expect(copy.test6[0].test1.test[0]).to.be.an('object').that.is.empty;
      });
    });

    describe('target 2', () => {
      let copy;

      beforeEach(() => {
        copy = cloneFixture();
        copy.test6[0].test1.test[0].target = target;
      });

      it('should find target', () => {
        expect(propertyFind(copy)).to.eql(target);
      });

      it('should find and remove target if specified', () => {
        const result = propertyFind(copy, true);

        expect(result).to.eql(target);
        expect(copy.test6[0].test1.test[0]).to.be.an('object').that.is.empty;
      });
    });

    describe('target 3', () => {
      let copy;

      beforeEach(() => {
        copy = cloneFixture();
        copy.test4.target = target;
      });

      it('should find target', () => {
        expect(propertyFind(copy)).to.eql(target);
      });

      it('should find and remove target if specified', () => {
        const result = propertyFind(copy, true);

        expect(result).to.eql(target);
        expect(copy.test4).to.be.an('object').that.is.empty;
      });
    });

    describe('target 4', () => {
      let copy;

      beforeEach(() => {
        copy = cloneFixture();
        copy.target = target;
      });

      it('should find target', () => {
        expect(propertyFind(copy)).to.eql(target);
      });

      it('should find and remove target if specified', () => {
        const result = propertyFind(copy, true);

        expect(result).to.eql(target);
        expect(copy.target).to.be.undefined;
      });
    });
  });
});
