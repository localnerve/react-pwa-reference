/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global Promise, before, after, describe, it */
'use strict';

var expect = require('chai').expect;

var testDom = require('../../../utils/testdom');
var requestAPI = require('../../../mocks/request');
var blobAPI = require('../../../mocks/blob');
var requestLib = require('application/assets/scripts/sw/utils/requests');

describe('sw/utils/requests', function () {
  var absoluteUrlNoSearch = 'https://example.org/route',
    absoluteUrlSearch = 'https://example.org/route?name=value',
    relativeUrlNoSearch = '/test',
    relativeUrlSearch = '/test?name=value',
    newName = 'newName',
    newValue = '123';

  function getSearch(url) {
    return url.split('?')[1];
  }

  function getValueByName(url, name) {
    var re = new RegExp('('+name+'=)([^&]+)');
    var m = re.exec(url, name);
    return m && m[2];
  }

  // test search and nv presence
  function queryStringTest(url, name, value) {
    var search = getSearch(url);
    var foundValue = getValueByName(search, name);
    if (value) {
      expect(foundValue).to.equal(value);
    } else {
      expect(foundValue).to.exist.and.not.be.false;
    }
  }

  // URL is covered in jsdom latest, but it doesn't support node 0.12 :-(
  describe('addOrReplaceUrlSearchParameter', function () {
    it('should add a search parameter to an absolute url without QS', function () {
      var result = requestLib.addOrReplaceUrlSearchParameter(absoluteUrlNoSearch, newName, newValue);
      queryStringTest(result, newName, newValue);
    });

    it('should add a search parameter to an absolute url with QS', function () {
      var result = requestLib.addOrReplaceUrlSearchParameter(absoluteUrlSearch, newName, newValue);
      queryStringTest(result, newName, newValue);
    });

    it('should add a search parameter to a relative url without QS', function () {
      var result = requestLib.addOrReplaceUrlSearchParameter(relativeUrlNoSearch, newName, newValue);
      queryStringTest(result, newName, newValue);
    });

    it('should add a search parameter to a relative url with QS', function () {
      var result = requestLib.addOrReplaceUrlSearchParameter(relativeUrlSearch, newName, newValue);
      queryStringTest(result, newName, newValue);
    });

    it('should replace a search parameter in an absolute url', function () {
      var replaceVal = 'oscarmeyer';
      var result = requestLib.addOrReplaceUrlSearchParameter(absoluteUrlNoSearch, newName, newValue);
      result = requestLib.addOrReplaceUrlSearchParameter(result, newName, replaceVal);
      queryStringTest(result, newName, replaceVal);
    });

    it('should replace a search parameter in a relative url', function () {
      var replaceVal = 'oscarmeyer';
      var result = requestLib.addOrReplaceUrlSearchParameter(relativeUrlNoSearch, newName, newValue);
      result = requestLib.addOrReplaceUrlSearchParameter(result, newName, replaceVal);
      queryStringTest(result, newName, replaceVal);
    });
  });

  describe('stripSearchParameters', function () {
    it('should remove query string for absolute url', function () {
      expect(absoluteUrlNoSearch).to.equal(requestLib.stripSearchParameters(absoluteUrlNoSearch));
    });

    it('should remove query string for relative url', function () {
      expect(relativeUrlNoSearch).to.equal(requestLib.stripSearchParameters(relativeUrlSearch));
    });
  });

  describe('cacheBustRequest', function () {
    it('should add a cache bust param to absolute url', function () {
      var result = requestLib.cacheBustRequest(absoluteUrlNoSearch);
      queryStringTest(result, 'sw-cache');
    });

    it('should add a cache bust param to absolute url with search', function () {
      var result = requestLib.cacheBustRequest(absoluteUrlSearch);
      queryStringTest(result, 'sw-cache');
    });

    it('should add a cache bust param to relative url', function () {
      var result = requestLib.cacheBustRequest(relativeUrlNoSearch);
      queryStringTest(result, 'sw-cache');
    });

    it('should add cache bust param to relative url with search', function () {
      var result = requestLib.cacheBustRequest(relativeUrlSearch);
      queryStringTest(result, 'sw-cache');
    });
  });

  describe('dehydrateRequest', function (done) {
    it('should return expected object', function () {
      var bodyType = 'json', body = 'hello', request = {
          method: 'GET',
          url: 'https://123.456',
          bodyType: bodyType,
          body: body
        }, expected = JSON.parse(JSON.stringify(request));

      request[bodyType] = function () {
        return Promise.resolve(body);
      };

      requestLib.dehydrateRequest(request, bodyType).then(function (actual) {
        expect(actual).to.eql(expected);
        done();
      }).catch(function (error) {
        done(error);
      });
    });
  });

  describe('rehydrateRequest', function () {
    before(function () {
      testDom.start();
      global.Request = requestAPI;
      global.Blob = blobAPI;
    });

    after(function () {
      testDom.stop();
      delete global.Blob;
      delete global.Request;
    });

    it('should create a Request from state', function (done) {
      var state = {
          url: 'https://123.456',
          method: 'GET',
          bodyType: 'json',
          body: {
            context: {
              '_csrf': 'A1B2C3D3'
            }
          }
        },
        apiInfo = {
          xhrContext: {
            '_csrf': 'A1B2C3D4'
          }
        };

      var result = requestLib.rehydrateRequest(state, apiInfo);

      expect(result.method).to.equal(state.method);
      expect(result.url).to.contain(state.url);
      expect(result.url).to.contain(apiInfo.xhrContext._csrf);
      expect(result.credentials).to.equal('include');
      result.json().then(function (rawBody) {
        var body = JSON.parse(rawBody);
        expect(body).to.be.an('object').that.is.not.empty;
        expect(body.context).to.be.an('object').that.is.not.empty;
        expect(body.context._csrf).to.equal('A1B2C3D4');
        done();
      });
    });
  });
});
