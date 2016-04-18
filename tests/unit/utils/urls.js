/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it, before */
'use strict';

var expect = require('chai').expect;

var urlm = require('../../../utils/urls');

describe('urls', function () {
  describe('hostname method', function () {
    var sigRepl = 'SNAME', hostRepl = 'HOST', testUrlCount = 13;

    var hostTemplates = [
      'this.'+sigRepl+'.com',
      sigRepl+'.com',
      '123456.'+sigRepl+'.com',
      '123456.'+sigRepl+'.com',
      '123456.'+sigRepl+'.com',
      'this.'+sigRepl+'.com',
      'this.'+sigRepl+'.com',
      sigRepl,
      sigRepl,
      '123456.'+sigRepl+'.com',
      '123456.'+sigRepl+'.com:3000',
      '123456.'+sigRepl+'.com:3000',
      '123456.'+sigRepl+'.com'
    ];
    var testUrlTemplates = [
      'https://'+hostRepl+'/something/?',
      'http://'+hostRepl,
      'http://'+hostRepl,
      'http://'+hostRepl+'?q=r',
      'http://'+hostRepl+'#hash',
      'https://'+hostRepl+'/something/else',
      'https://'+hostRepl+'/something/else.html',
      'http://'+hostRepl,
      'http://'+hostRepl+'/',
      'https://'+hostRepl,
      '//'+hostRepl,
      '//'+hostRepl+'/something',
      'http://'+hostRepl+'/12x12/something/http://another.host.com/image/0.jpg'
    ];
    var significantNames = [];
    var hosts = [];
    var testUrls = [];

    before(function () {
      var i;

      for (i = 0; i < testUrlCount; i++) {
        significantNames.push('significant-'+i);
      }
      for (i = 0; i < testUrlCount; i++) {
        hosts.push(hostTemplates[i].replace(sigRepl, significantNames[i]));
      }
      for (i = 0; i < testUrlCount; i++) {
        testUrls.push(testUrlTemplates[i].replace(hostRepl, hosts[i]));
      }
    });

    describe('getHostname', function () {
      it('should retrieve hostname from urls', function () {
        testUrls.forEach(function (url, index) {
          expect(urlm.getHostname(url)).to.eql(hosts[index].replace(/\:.+$/, ''));
        });
      });
    });

    describe('getSignificantHostname', function () {
      it('should retrieve signicant hostname from urls', function () {
        testUrls.forEach(function (url, index) {
          expect(urlm.getSignificantHostname(url)).to.eql(significantNames[index]);
        });
      });
    });
  });

  describe('path method', function () {
    var test1 = 'search', test2 = 'search-item.html';
    var pathRepl = 'RPATH';
    var pathTemplates = [
      'https://www.google.com:3000/dir/1/2/RPATH?arg=0-a&arg1=1-b&arg3-c#hash',
      'https://www.google.com:3000/dir/1/2/RPATH/?arg=0-a&arg1=1-b&arg3-c#hash',
      'https://www.google.com:3000/dir/1/2/RPATH#hash',
      'https://www.google.com:3000/dir/1/2/RPATH',
      'https://www.google.com:3000/dir/1/2/RPATH/',
      '/dir/1/2/RPATH',
      '/dir/1/2/RPATH/',
      'dir/1/2/RPATH',
      'dir/1/2/RPATH/',
      'RPATH',
      'RPATH/'
    ];
    var paths1 = [];
    var paths2 = [];

    before(function () {
      pathTemplates.forEach(function (path) {
        paths1.push(path.replace(pathRepl, test1));
      });
      pathTemplates.forEach(function (path) {
        paths2.push(path.replace(pathRepl, test2));
      });
    });

    describe('getLastPathSegment', function () {
      it('should retrieve the last path segment from urls, paths, files: Simple segment', function () {
        paths1.forEach(function (path) {
          var last = urlm.getLastPathSegment(path);
          expect(last).to.eql(test1);
        });
      });

      it('should retrieve the last path segment from urls, paths, files: Delimited segment', function () {
        paths2.forEach(function (path) {
          var last = urlm.getLastPathSegment(path);
          expect(last).to.eql(test2);
        });
      });
    });
  });
});
