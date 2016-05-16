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

      /**
       * Test the buildImageUrl function with a different name input.
       * @param {String} name - The image name.
       * @param {Boolean} contains - true if url should contain name.
       */
      function testImageName (name, contains) {
        url = buildImageUrl(serviceUrl, {
          width: width,
          height: height,
          name: name,
          serviceOptions: {}
        });

        expect(url).to.match(new RegExp('^' + serviceUrl));
        expect(url).to.contain(width);
        expect(url).to.contain(height);
        if (contains) {
          expect(url).to.contain(name);
        } else {
          expect(url).to.not.contain(name);
        }
        expect(url).to.match(/[1-9]\/$/);
      }

      it('should build a lorempixel url with random numeric image', function () {
        testImageName('tester');
      });

      it('should build a lorempixel url from image base name, not zero', function () {
        testImageName('0.jpg');
      });

      it('should build a lorempixel url from image base name', function () {
        var imageName = '4',
          name = imageName + '.jpg';

        testImageName(name);
        expect(url).to.match(new RegExp(imageName +'\/$'));
      });

      it('should build a lorempixel url from image name', function () {
        var name = '4';

        testImageName(name, true);
        expect(url).to.match(new RegExp(name +'\/$'));
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

      function basicTests (url) {
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
      }

      it('should build a request, no cropMode', function () {
        url = buildImageUrl(serviceUrl, {
          serviceOptions: {
            cloudName: cloudName
          },
          width: width,
          height: height,
          name: imageName
        });

        basicTests(url);

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

        basicTests(url);

        expect(url).to.contain(cropMode);
      });

      it('should reduce size of jpgs', () => {
        url = buildImageUrl(serviceUrl, {
          serviceOptions: {
            cloudName: cloudName
          },
          width: width,
          height: height,
          name: 'name.jpg'
        });

        basicTests(url);

        expect(url).to.contain('fl_progressive');
        expect(url).to.contain('q_');
      });
    });
  });
});
