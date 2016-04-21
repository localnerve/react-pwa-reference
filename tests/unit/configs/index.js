/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/*eslint no-console:0 */
/* global describe, it, before, beforeEach, afterEach */
'use strict';

var expect = require('chai').expect;
var assert = require('chai').assert;
var localEnv = require('../../../configs/local.env.json');
var configLib = require('../../../configs');

describe('configs', function () {
  describe('index', function () {
    it('accepts overrides', function () {
      var value = 'ItsAPizzaPie1';
      var config = configLib.create({ PIZZA: value });
      expect(config.PIZZA).to.equal(value);
    });

    it('loads env vars', function () {
      var value = 'ItsAPizzaPie2';
      process.env.PIZZA = value;

      var config = configLib.create();
      expect(config.PIZZA).to.equal(value);
    });

    it('fallsback to local dev env vars', function () {
      var value = localEnv.PORT;

      delete process.env.PORT; // not sure if this really works
      assert.isUndefined(process.env.PORT, 'process.env.PORT was unexpectedly defined and invalidated this test');

      var config = configLib.create();
      expect(config.PORT).to.equal(value);
    });

    it('allows env vars to override to local dev env vars', function () {
      var value = 8080;
      process.env.PORT = value;

      var config = configLib.create();
      expect(Number(config.PORT)).to.equal(value);
    });
  });

  describe('settings', function () {
    var config;

    beforeEach(function () {
      config = configLib.create();
    });

    it('loads settings.web', function () {
      expect(config.settings.web).to.be.an('object').that.is.not.empty;
    });

    it('loads settings.dist', function () {
      expect(config.settings.dist).to.be.an('object').that.is.not.empty;
    });

    it('loads settings.src', function () {
      expect(config.settings.src).to.be.an('object').that.is.not.empty;
    });

    it('defines testable web assets object', function () {
      var assets = config.settings.web.assets;
      expect(assets).to.be.an('object').that.is.not.empty;
      expect(assets.mainScript).to.be.a('function');
      expect(config.settings.src.assetsJson).to.be.a('string').that.is.not.empty;
    });

    it('loads script asset dynamically as expected', function (done) {
      var fs = require('fs'), path = require('path'),
        assetsJsonFile = path.join(__dirname, '../../..', config.settings.src.assetsJson),
        assetsJsonData = JSON.stringify({
          assets: {
            main: [
              'main.js',
              'main.js.map'
            ],
            sw: [
              'sw.js',
              'sw.js.map'
            ],
            swReg: [
              'swReg.js',
              'swReg.js.map'
            ]
          }
        });

      function testAssetScript (script, map) {
        expect(script).to.be.a('string').that.is.not.empty;
        expect(script).to.contain(config.settings.web.scripts);
        if (map) {
          expect(script).to.match(/\.map$/);
        } else {
          expect(script).to.match(/\.js$/);
        }
      }

      function testAssetScripts () {
        var main = config.settings.web.assets.mainScript();
        var swReg = config.settings.web.assets.swRegScript();
        var sw = config.settings.web.assets.swMainScript();
        var swMapName = config.settings.web.assets.swMainScriptMap(true);
        var swMapFull = config.settings.web.assets.swMainScriptMap();

        testAssetScript(main);
        testAssetScript(swReg);
        testAssetScript(sw);

        if (swMapName) {
          testAssetScript(swMapFull, true);
          expect(swMapName).to.be.a('string').that.is.not.empty;
          expect(swMapName).to.match(/\.map$/);
        }

        done();
      }

      if (!fs.existsSync(assetsJsonFile)) {
        console.log('assets json did not exist');
        fs.writeFile(assetsJsonFile, assetsJsonData, function (err) {
          if (err) {
            return done(err);
          }
          testAssetScripts();
        });
      } else {
        console.log('assets json pre-existed');
        testAssetScripts();
      }
    });
  });

  describe('images', function () {
    var config;

    beforeEach(function () {
      config = configLib.create();
    });

    describe('service url', function () {
      var url = '123.com';

      afterEach(function () {
        delete process.env.FIRESIZE_URL;
        delete process.env.IMAGE_SERVICE_URL;
      });

      it('should exist', function () {
        expect(config.images.service.url).to.be.a('function');
      });

      it('should return a string and have a default', function () {
        expect(config.images.service.url()).to.be.a('string').that.is.not.empty;
      });

      it.skip('should return FIRESIZE_URL if defined', function () {
        process.env.FIRESIZE_URL = url;
        expect(config.images.service.url()).to.equal(url);
      });

      it('should return IMAGE_SERVICE_URL if defined', function () {
        process.env.FIRESIZE_URL = 'wrong_url';
        process.env.IMAGE_SERVICE_URL = url;
        expect(config.images.service.url()).to.equal(url);
      });
    });

    describe('service cloudName', function () {
      before(function () {
        // just in case this is hanging around in local env
        delete process.env.CLOUD_NAME;
      });

      afterEach(function () {
        delete process.env.CLOUD_NAME;
      });

      it('should exist', function () {
        expect(config.images.service.cloudName).to.be.a('function');
      });

      it('should be undefined by default', function () {
        expect(config.images.service.cloudName()).to.be.undefined;
      });

      it('should return CLOUD_NAME if defined', function () {
        var cloudName = 'correct_cloudname';
        process.env.CLOUD_NAME = cloudName;
        expect(config.images.service.cloudName()).to.equal(cloudName);
      });
    });
  });

  describe('contact', function () {
    var config;

    beforeEach(function () {
      config = configLib.create();
    });

    describe('mail', function () {
      it('should exist', function () {
        expect(config.contact.mail).to.be.an('object').that.is.not.empty;
        expect(config.contact.mail.subject).to.be.a('string').that.is.not.empty;
      });

      describe('service', function () {
        afterEach(function () {
          delete process.env.MAIL_SERVICE;
        });

        it('should exist and have a default', function () {
          expect(config.contact.mail.service).to.be.a('function');
          expect(config.contact.mail.service()).to.be.a('string').that.is.not.empty;
        });

        it('should return MAIL_SERVICE if defined', function () {
          var service = 'wellknown';
          process.env.MAIL_SERVICE = service;
          expect(config.contact.mail.service()).to.equal(service);
        });
      });

      describe('username', function () {
        before(function () {
          // just in case this is hanging around in a local env
          delete process.env.MANDRILL_USERNAME;
          delete process.env.MAIL_USERNAME;
        });

        afterEach(function () {
          delete process.env.MANDRILL_USERNAME;
          delete process.env.MAIL_USERNAME;
        });

        it('should exist and be undefined by default', function () {
          expect(config.contact.mail.username).to.be.a('function');
          expect(config.contact.mail.username()).to.be.undefined;
        });

        it('should return MANDRILL_USERNAME if defined', function () {
          var username = 'correct_username';
          process.env.MANDRILL_USERNAME = username;
          expect(config.contact.mail.username()).to.equal(username);
        });

        it('should return MAIL_USERNAME if defined', function () {
          var username = 'sircharlesbarkley@sportscenter.com';
          process.env.MANDRILL_USERNAME = 'wrong_username';
          process.env.MAIL_USERNAME = username;
          expect(config.contact.mail.username()).to.equal(username);
        });
      });

      describe('password', function () {
        var password = '123456';

        before(function () {
          // just in case this is hanging around in a local env
          delete process.env.MANDRILL_APIKEY;
          delete process.env.MAIL_PASSWORD;
        });

        afterEach(function () {
          delete process.env.MANDRILL_APIKEY;
          delete process.env.MAIL_PASSWORD;
        });

        it('should exist and but be undefined by default', function () {
          expect(config.contact.mail.password).to.be.a('function');
          expect(config.contact.mail.password()).to.be.undefined;
        });

        it('should return MANDRILL_APIKEY if defined', function () {
          process.env.MANDRILL_APIKEY = password;
          expect(config.contact.mail.password()).to.equal(password);
        });

        it('should return MAIL_PASSWORD if defined', function () {
          process.env.MANDRILL_APIKEY = 'wrong_password';
          process.env.MAIL_PASSWORD = password;
          expect(config.contact.mail.password()).to.equal(password);
        });
      });

      describe('mailTo', function () {
        var theMailTo = 'this@that';

        before(function () {
          // just in case this is hanging around in a local env
          delete process.env.MAIL_TO;
        });

        afterEach(function () {
          delete process.env.MAIL_TO;
        });

        it('should give different defaults based on NODE_ENV', function () {
          var contact;
          contact = configLib.create({ NODE_ENV: 'development' }).contact;
          var defaultDev = contact.mail.to();

          contact = configLib.create({ NODE_ENV: 'production' }).contact;
          var defaultProd = contact.mail.to();

          expect(defaultDev).to.be.a('string').that.is.not.empty;
          expect(defaultProd).to.be.a('string').that.is.not.empty;
          expect(defaultDev).to.not.equal(defaultProd);
        });

        it('should return MAIL_TO if defined', function () {
          process.env.MAIL_TO = theMailTo;
          var contact = configLib.create({ NODE_ENV: 'development' }).contact;

          expect(contact.mail.to()).to.equal(theMailTo);
        });
      });

      describe('mailFrom', function () {
        var theMailFrom = 'this@that';

        before(function () {
          // just in case this is hanging around in a local env
          delete process.env.MAIL_FROM;
        });

        afterEach(function () {
          delete process.env.MAIL_FROM;
        });

        it('should give different defaults based on NODE_ENV', function () {
          var contact;
          contact = configLib.create({ NODE_ENV: 'development' }).contact;
          var defaultDev = contact.mail.from();

          contact = configLib.create({ NODE_ENV: 'production' }).contact;
          var defaultProd = contact.mail.from();

          expect(defaultDev).to.be.a('string').that.is.not.empty;
          expect(defaultProd).to.be.a('string').that.is.not.empty;
          expect(defaultDev).to.not.equal(defaultProd);
        });

        it('should return MAIL_FROM if defined', function () {
          process.env.MAIL_FROM = theMailFrom;
          var contact = configLib.create({ NODE_ENV: 'development' }).contact;

          expect(contact.mail.from()).to.equal(theMailFrom);
        });
      });
    });

    describe('queue', function () {
      describe('queue.name', function () {
        var queueName = 'correct_queue';

        before(function () {
          // just in case this is hanging around in the local env
          delete process.env.QUEUE_NAME;
        });

        afterEach(function () {
          delete process.env.QUEUE_NAME;
        });

        it('should exist and have a default', function () {
          expect(config.contact.queue.name).to.be.a('function');
          expect(config.contact.queue.name()).to.be.a('string').that.is.not.empty;
        });

        it('should return QUEUE_NAME if defined', function () {
          process.env.QUEUE_NAME = queueName;
          expect(config.contact.queue.name()).to.equal(queueName);
        });
      });

      describe('queue.url', function () {
        var queueUrl = 'amqp://impossible:56754';

        before(function () {
          // just in case this is hanging around in the local env
          delete process.env.QUEUE_URL;
          delete process.env.CLOUDAMQP_URL;
        });

        afterEach(function () {
          delete process.env.QUEUE_URL;
          delete process.env.CLOUDAMQP_URL;
        });

        it('should exist and have a default', function () {
          expect(config.contact.queue.url).to.be.a('function');
          expect(config.contact.queue.url()).to.be.a('string').that.is.not.empty;
          expect(config.contact.queue.url()).to.not.equal(queueUrl);
        });

        it('should give different defaults based on NODE_ENV', function () {
          process.env.CLOUDAMQP_URL = queueUrl;

          config = configLib.create({ NODE_ENV: 'development' });
          var defaultDev = config.contact.queue.url();

          config = configLib.create({ NODE_ENV: 'production' });
          var defaultProd = config.contact.queue.url();

          expect(defaultDev).to.be.a('string').that.is.not.empty;
          expect(defaultProd).to.be.a('string').that.is.not.empty;

          expect(defaultProd).to.not.equal(defaultDev);
        });

        it('should return QUEUE_URL if defined', function () {
          process.env.QUEUE_URL = queueUrl;
          expect(config.contact.queue.url()).to.equal(queueUrl);
        });
      });
    });
  });

  describe('data', function () {
    describe('FRED', function () {
      it('decorates FRED url', function () {
        var config = configLib.create().data;
        var decoration = config.FRED.branchify('');
        var url = config.FRED.url();
        expect(url).to.contain(decoration);
      });

      it('changes decoration by environment', function () {
        var config1 = configLib.create({ NODE_ENV: 'production' }).data;
        var decoration1 = config1.FRED.branchify('');

        var config2 = configLib.create({ NODE_ENV: 'development' }).data;
        var decoration2 = config2.FRED.branchify('');

        expect(decoration1).to.not.equal(decoration2);
      });
    });
  });

  describe('push', function () {
    var theApiKey = 'A1S2D3F4G5H6J7K8L9';

    before(function () {
      // just in case this is hanging around in the local env
      delete process.env.PUSH_API_KEY;
      delete process.env.GCM_API_KEY;
    });

    afterEach(function () {
      delete process.env.PUSH_API_KEY;
      delete process.env.GCM_API_KEY;
    });

    function getApiKey () {
      return configLib.create().push.service.apiKey();
    }

    it('should return undefined if no env vars', function () {
      expect(getApiKey()).to.be.undefined;
    });

    it('should return a value for PUSH_API_KEY first', function () {
      process.env.PUSH_API_KEY = theApiKey;
      process.env.GCM_API_KEY = 'thisisbad';

      expect(getApiKey()).to.equal(theApiKey);
    });

    it('should return GCM_API_KEY if PUSH_API_KEY not defined', function () {
      process.env.GCM_API_KEY = theApiKey;

      assert.isUndefined(process.env.PUSH_API_KEY);
      expect(getApiKey()).to.equal(theApiKey);
    });
  });
});
