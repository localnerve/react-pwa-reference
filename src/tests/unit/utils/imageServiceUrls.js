/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global before, describe, it */
'use strict';

var expect = require('chai').expect;

var imageServiceUrls = require('utils/imageServiceUrls');

describe('imageServiceUrls', function () {
  it('should export expected operations', function () {
    expect(imageServiceUrls).to.respondTo('buildImageUrl');
  });

  describe('buildImageUrl', function () {
    var buildImageUrl, url;

    before('buildImageUrl', function () {
      buildImageUrl = imageServiceUrls.buildImageUrl;
    });

    it('should fail for non-supported service', function () {
      expect(function () {
        buildImageUrl('https://notsupported.net', {});
      }).to.throw(Error);
    });

    describe('lorempixel', function () {
      var serviceUrl = 'https://lorempixel.com',
        width = 10,
        height = 20;

      it('should build a lorempixel url with random numeric image', function () {
        var name = 'tester';

        url = buildImageUrl(serviceUrl, {
          width: width,
          height: height,
          name: name,
          serviceOptions: {}
        });

        expect(url).to.match(new RegExp('^' + serviceUrl));
        expect(url).to.contain(width);
        expect(url).to.contain(height);
        expect(url).to.not.contain(name);
        expect(url).to.match(/[1-9]\/$/);
      });

      it('should build a lorempixel url from image base name, not zero', function () {
        var name = '0.jpg';

        url = buildImageUrl(serviceUrl, {
          width: width,
          height: height,
          name: name,
          serviceOptions: {}
        });

        expect(url).to.match(new RegExp('^' + serviceUrl));
        expect(url).to.contain(width);
        expect(url).to.contain(height);
        expect(url).to.not.contain(name);
        expect(url).to.match(/[1-9]\/$/);
      });

      it('should build a lorempixel url from image base name', function () {
        var imageName = '4',
          name = imageName + '.jpg';

        url = buildImageUrl(serviceUrl, {
          width: width,
          height: height,
          name: name,
          serviceOptions: {}
        });

        expect(url).to.match(new RegExp('^' + serviceUrl));
        expect(url).to.contain(width);
        expect(url).to.contain(height);
        expect(url).to.not.contain(name);
        expect(url).to.match(new RegExp(imageName +'\/$'));
      });

      it('should build a lorempixel url from image name', function () {
        var name = '4';

        url = buildImageUrl(serviceUrl, {
          width: width,
          height: height,
          name: name,
          serviceOptions: {}
        });

        expect(url).to.match(new RegExp('^' + serviceUrl));
        expect(url).to.contain(width);
        expect(url).to.contain(height);
        expect(url).to.contain(name);
        expect(url).to.match(new RegExp(name +'\/$'));
      });
    });

    describe.skip('firesize', function () {
      var serviceUrl = 'https://1233321.firesize.com',
        width = 30,
        height = 40;

      it('should build a firesize url to lorempixel when origin omitted', function () {
        var name = 'tester2',
          matches;

        url = buildImageUrl(serviceUrl, {
          width: width,
          height: height,
          name: name,
          serviceOptions: {}
        });

        // should start with the serviceUrl
        expect(url).to.match(new RegExp('^' + serviceUrl));

        // should be two occurrences of http in the request
        matches = url.match(/http/g);
        expect(matches || []).to.have.length(2);

        // should be two occurrences of width in the request
        matches = url.match(new RegExp('([^\\d]'+width+'[^\\d])', 'g'));
        expect(matches || []).to.have.length(2);

        // should be two occurrences of height in the request
        matches = url.match(new RegExp('([^\\d]'+height+'[^\\d])', 'g'));
        expect(matches || []).to.have.length(2);

        // since lorempixel used, name omitted
        expect(url).to.not.contain(name);

        // should default to g_center
        expect(url).to.contain('g_center');

        // should contain lorempixel
        expect(url).to.contain('lorempixel');
      });

      it('should include gavity when supplied', function () {
        var gravity = 'g_none';

        url = buildImageUrl(serviceUrl, {
          width: width,
          height: height,
          serviceOptions: {
            gravity: gravity
          }
        });

        expect(url).to.contain(gravity);
      });

      it('should build a firesize url to location when supplied', function () {
        var host = 'tvontheradio', ssl = true, path = '/dancing/choose/',
          name = 'TVonTheRadio.jpg',
          matches;

        url = buildImageUrl(serviceUrl, {
          width: width,
          height: height,
          name: name,
          serviceOptions: {
            origin: {
              host: host,
              ssl: ssl,
              path: path
            }
          }
        });

        // should start with the serviceUrl
        expect(url).to.match(new RegExp('^' + serviceUrl));

        // should only contain correct number of https
        matches = url.match(/https/g);
        expect(matches).to.have.length(
          ssl ? 1 : 0
        );

        // make sure any // are only after a colon
        // (no double slash in paths)
        matches = url.match(/[^:]\/\//g);
        expect(matches || []).to.have.length(0);

        // should be one occurrence of width in the request
        matches = url.match(new RegExp('([^\\d]'+width+'[^\\d])', 'g'));
        expect(matches || []).to.have.length(1);

        // should be one occurrence of height in the request
        matches = url.match(new RegExp('([^\\d]'+height+'[^\\d])', 'g'));
        expect(matches || []).to.have.length(1);

        // should default to g_center
        expect(url).to.contain('g_center');

        // should end with protocol, host, path, name
        // slashes should be clipped as expected.
        expect(url).to.match(new RegExp(
          (ssl ? 'https' : 'http') +
          ':\/\/' + host + '\/' +
          path.replace(/^\/|\/$/g, '').replace('/', '\/') + '\/' +
          name.replace('.', '\.') + '$'
        ));
      });
    });

    describe('cloudinary', function () {
      var cloudName = 'cloud',
        width = 100,
        height = 200,
        imageName = 'image',
        cropMode = 'mymode',
        serviceUrl = 'https://res.cloudinary.com',
        matches;

      it('should build a request, no cropMode', function () {
        url = buildImageUrl(serviceUrl, {
          serviceOptions: {
            cloudName: cloudName
          },
          width: width,
          height: height,
          name: imageName
        });

        // should start with the serviceUrl
        expect(url).to.match(new RegExp('^' + serviceUrl));

        // should be one occurrence of width in the request
        matches = url.match(new RegExp('([^\\d]'+width+'[^\\d])', 'g'));
        expect(matches || []).to.have.length(1);

        // should be one occurrence of height in the request
        matches = url.match(new RegExp('([^\\d]'+height+'[^\\d])', 'g'));
        expect(matches || []).to.have.length(1);

        expect(url).to.contain(imageName);
        expect(url).to.contain(cloudName);

        // should default to c_fill
        expect(url).to.contain('c_fill');
      });

      it('should build a request, with cropMode', function () {
        url = buildImageUrl(serviceUrl, {
          serviceOptions: {
            cloudName: cloudName,
            cropMode: cropMode
          },
          width: width,
          height: height,
          name: imageName
        });

        // should start with the serviceUrl
        expect(url).to.match(new RegExp('^' + serviceUrl));

        // should be one occurrence of width in the request
        matches = url.match(new RegExp('([^\\d]'+width+'[^\\d])', 'g'));
        expect(matches || []).to.have.length(1);

        // should be one occurrence of height in the request
        matches = url.match(new RegExp('([^\\d]'+height+'[^\\d])', 'g'));
        expect(matches || []).to.have.length(1);

        expect(url).to.contain(imageName);
        expect(url).to.contain(cloudName);
        expect(url).to.contain(cropMode);
      });
    });
  });
});
