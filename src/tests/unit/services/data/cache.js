/**
 * Copyright (c) 2016 - 2020 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global beforeEach, describe, it */
import { expect } from 'chai';
import cache from 'application/server/services/data/cache-interface';
import cacheResources from 'test/fixtures/cache-resources';

describe('data/cache-interface', () => {
  const models = cacheResources.models;

  describe('put', () => {
    it('should throw if undefined params supplied', () => {
      expect(() => {
        cache.put(undefined, false);
      }).to.throw(Error);
    });

    it('should throw if empty params supplied', () => {
      expect(() => {
        cache.put(cacheResources.nothing, true);
      }).to.throw(Error);
    });

    it('should throw if no data supplied', () => {
      expect(() => {
        cache.put(cacheResources.noData, cacheResources.noData.data);
      }).to.throw(Error);
    });

    it('should throw if bad format supplied', () => {
      expect(() => {
        cache.put(cacheResources.badFormat, cacheResources.badFormat.data);
      }).to.throw(Error);
    });

    it('should format json if no format supplied', () => {
      return cache.put(cacheResources.noFormat, cacheResources.noFormat.data)
        .then(() => {
          const res = cache.get(cacheResources.noFormat.resource);

          expect(res).to.be.an('object');
          expect(res).to.have.property('models', undefined);
          expect(res).to.have.property('content')
            .that.deep.equals(cacheResources.jsonData.test);
        });
    });

    it('should put models as expected', () => {
      return cache.put(models, models.data).then(() => {
        const res = cache.get(models.resource);

        expect(res).to.be.an('object');
        expect(res).to.have.property('models', undefined);
        expect(res).to.have.property('content')
          .that.deep.equals(cacheResources.validModels.models);
      });
    });

    it('should put valid data with no models', () => {
      const validNone = cacheResources.markup.validNone;

      return cache.put(validNone, validNone.data)
        .then(() => {
          const res = cache.get(validNone.resource);

          expect(res).to.be.an('object');
          expect(res).to.have.property('models', undefined);
          expect(res).to.have.property('content')
            .that.deep.equals(cacheResources.markupData);
        });
    });

    it('should put valid data with single, valid model', () => {
      const validSingle = cacheResources.markup.validSingle;

      return cache.put(validSingle, validSingle.data).then(() => {
        const res = cache.get(validSingle.resource);

        expect(res).to.be.an('object');
        expect(res).to.have.property('models')
          .that.deep.equals({
            ValidModel1: cacheResources.validModels.models.ValidModel1
          });
        expect(res).to.have.property('content')
          .that.deep.equals(cacheResources.markupData);
      });
    });

    it('should put valid data with multiple, valid model', () => {
      const validMulti = cacheResources.markup.validMulti;

      return cache.put(validMulti, validMulti.data).then(() => {
        const res = cache.get(validMulti.resource);

        expect(res).to.be.an('object');
        expect(res).to.have.property('models')
          .that.deep.equals(cacheResources.validModels.models);
        expect(res).to.have.property('content')
          .that.deep.equals(cacheResources.markupData);
      });
    });

    it('should have undefined model if invalid model reference supplied', () => {
      const invalid = cacheResources.markup.invalid;

      return cache.put(invalid, invalid.data).then(() => {
        const res = cache.get(invalid.resource);

        expect(res).to.be.an('object');
        expect(res).to.have.nested.property('models.InvalidModel', undefined);
        expect(res).to.have.property('content')
          .that.deep.equals(cacheResources.markupData);
      });
    });
  });

  describe('get', () => {
    it('should return undefined for miss', () => {
      expect(cache.get('bogus')).to.be.undefined;
    });

    it('should return valid for hit', () => {
      const res = cache.get(models.resource);

      expect(res).to.be.an('object');
      expect(res).to.have.property('models', undefined);
      expect(res).to.have.property('content')
        .that.deep.equals(cacheResources.validModels.models);
    });
  });

  describe('find', () => {
    let res;
    const notFoundValue = 'notFound';

    // assert 'put' cache state preconditions exist.
    beforeEach('find', () => {
      res = cache.get(cacheResources.noFormat.resource);
      expect(res.content.resource).to.equal(cacheResources.jsonData.test.resource);
    });

    it('should return undefined if bad input', () => {
      expect(cache.find()).to.be.undefined;
    });

    it('should find valid item', () => {
      const result = cache.find(cacheResources.jsonData.test.resource);
      expect(result).to.eql(res.content);
    });

    it('should not find valid item', () => {
      const result = cache.find(notFoundValue);
      expect(result).to.be.undefined;
    });
  });
});
