/**
 * Copyright (c) 2016 - 2020 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* eslint no-console:0 */
/* global Promise, describe, it, before, beforeEach, afterEach */

import { expect } from 'chai';
import { assert } from 'chai';
import path from 'path';
import configLib from 'configs';
import utils from 'utils/node';
import localEnv from 'configs/local.env.json';

describe('configs', () => {
  describe('index', () => {
    it('accepts overrides', () => {
      const value = 'ItsAPizzaPie1';
      const config = configLib.create({ PIZZA: value });
      expect(config.PIZZA).to.equal(value);
    });

    it('loads env vars', () => {
      const value = 'ItsAPizzaPie2';
      process.env.PIZZA = value;

      const config = configLib.create();
      expect(config.PIZZA).to.equal(value);
    });

    it('fallsback to local dev env vars', () => {
      const value = localEnv.PORT;

      delete process.env.PORT; // not sure if this really works
      assert.isUndefined(process.env.PORT, 'process.env.PORT was unexpectedly defined and invalidated this test');

      const config = configLib.create();
      expect(config.PORT).to.equal(value);
    });

    it('allows env vars to override to local dev env vars', () => {
      const value = 8080;
      process.env.PORT = value;

      const config = configLib.create();
      expect(Number(config.PORT)).to.equal(value);
    });
  });

  describe('settings', () => {
    const fs = require('fs');
    let config;

    /**
     * Make sure the assets build output files are available.
     */
    function ensureAssetFiles (done) {
      const assetsJsonFile = path.join(
        path.dirname(require.resolve('configs/settings/index.js')),
        'assets.json'
      );
      const assetsJsonData = JSON.stringify({
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
      const revManifestFile = path.join(
        path.dirname(require.resolve('configs/settings/index.js')),
        'assets-rev-manifest.json'
      );
      const revManifestData = JSON.stringify({
        'images/android-chrome-144x144.png':
          'images/android-chrome-144x144-aa104ff74a.png',
        'images/android-chrome-192x192.png':
          'images/android-chrome-192x192-3f837d5a9e.png'
      });

      Promise.all([
        utils.nodeCall(fs.stat, assetsJsonFile)
          .catch((err) => {
            if (err.code === 'ENOENT') {
              console.log('assets json did not exist');
              return utils.nodeCall(
                fs.writeFile, assetsJsonFile, assetsJsonData
              );
            }
            throw err;
          }),
        utils.nodeCall(fs.stat, revManifestFile)
          .catch((err) => {
            if (err.code === 'ENOENT') {
              console.log('assets rev manifest did not exist');
              return utils.nodeCall(
                fs.writeFile, revManifestFile, revManifestData
              );
            }
            throw err;
          })
      ])
        .then(() => {
          done();
        })
        .catch(done);
    }

    beforeEach(() => {
      config = configLib.create();
    });

    it('loads settings.web', () => {
      expect(config.settings.web).to.be.an('object').that.is.not.empty;
    });

    it('loads settings.dist', () => {
      expect(config.settings.dist).to.be.an('object').that.is.not.empty;
    });

    it('loads settings.src', () => {
      expect(config.settings.src).to.be.an('object').that.is.not.empty;
    });

    it('defines testable web assets object', () => {
      const assets = config.settings.web.assets;
      expect(assets).to.be.an('object').that.is.not.empty;
      expect(assets.mainScript).to.be.a('function');
      expect(config.settings.src.assetsJson).to.be.a('string').that.is.not.empty;
    });

    it('loads script asset dynamically as expected', (done) => {
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
        const main = config.settings.web.assets.mainScript();
        const swReg = config.settings.web.assets.swRegScript();
        const sw = config.settings.web.assets.swMainScript();
        const swMapName = config.settings.web.assets.swMainScriptMap(true);
        const swMapFull = config.settings.web.assets.swMainScriptMap();

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

      ensureAssetFiles((err) => {
        if (err) {
          return done(err);
        }
        testAssetScripts();
      });
    });

    it('loads revved assets dynamically as expected', (done) => {
      function testAssetRevScripts () {
        const asset144 =
          config.settings.web.assets.revAsset('android-chrome-144x144.png');
        const asset192 =
          config.settings.web.assets.revAsset('android-chrome-192x192.png');

        [asset144, asset192].forEach((asset) => {
          expect(asset).to.exist;
          expect(asset).to.be.a('string').that.is.not.empty;
          expect(asset).to.contain(config.settings.web.images);
          expect(asset).to.match(/\.png$/);
        });

        done();
      }

      ensureAssetFiles((err) => {
        if (err) {
          return done(err);
        }
        testAssetRevScripts();
      });
    });
  });

  describe('images', () => {
    let config;

    beforeEach(() => {
      config = configLib.create();
    });

    describe('service url', () => {
      const url = '123.com';

      afterEach(() => {
        delete process.env.FIRESIZE_URL;
        delete process.env.IMAGE_SERVICE_URL;
      });

      it('should exist', () => {
        expect(config.images.service.url).to.be.a('function');
      });

      it('should return a string and have a default', () => {
        expect(config.images.service.url()).to.be.a('string').that.is.not.empty;
      });

      it('should return IMAGE_SERVICE_URL if defined', () => {
        process.env.FIRESIZE_URL = 'wrong_url';
        process.env.IMAGE_SERVICE_URL = url;
        expect(config.images.service.url()).to.equal(url);
      });
    });

    describe('service cloudName', () => {
      before(() => {
        // just in case this is hanging around in local env
        delete process.env.CLOUD_NAME;
      });

      afterEach(() => {
        delete process.env.CLOUD_NAME;
      });

      it('should exist', () => {
        expect(config.images.service.cloudName).to.be.a('function');
      });

      it('should be undefined by default', () => {
        expect(config.images.service.cloudName()).to.be.undefined;
      });

      it('should return CLOUD_NAME if defined', () => {
        const cloudName = 'correct_cloudname';
        process.env.CLOUD_NAME = cloudName;
        expect(config.images.service.cloudName()).to.equal(cloudName);
      });
    });
  });

  describe('contact', () => {
    let config;

    beforeEach(() => {
      config = configLib.create();
    });

    describe('mail', () => {
      it('should exist', () => {
        expect(config.contact.mail).to.be.an('object').that.is.not.empty;
        expect(config.contact.mail.subject).to.be.a('string').that.is.not.empty;
      });

      describe('service', () => {
        afterEach(() => {
          delete process.env.MAIL_SERVICE;
        });

        it('should exist and have a default', () => {
          expect(config.contact.mail.service).to.be.a('function');
          expect(config.contact.mail.service()).to.be.a('string').that.is.not.empty;
        });

        it('should return MAIL_SERVICE if defined', () => {
          const service = 'wellknown';
          process.env.MAIL_SERVICE = service;
          expect(config.contact.mail.service()).to.equal(service);
        });
      });

      describe('username', () => {
        before(() => {
          // just in case this is hanging around in a local env
          delete process.env.SPARKPOST_USERNAME;
          delete process.env.MAIL_USERNAME;
        });

        afterEach(() => {
          delete process.env.SPARKPOST_USERNAME;
          delete process.env.MAIL_USERNAME;
        });

        it('should exist and be undefined by default', () => {
          expect(config.contact.mail.username).to.be.a('function');
          expect(config.contact.mail.username()).to.be.undefined;
        });

        it('should return MANDRILL_USERNAME if defined', () => {
          const username = 'correct_username';
          process.env.SPARKPOST_USERNAME = username;
          expect(config.contact.mail.username()).to.equal(username);
        });

        it('should return MAIL_USERNAME if defined', () => {
          const username = 'sircharlesbarkley@sportscenter.com';
          process.env.SPARKPOST_USERNAME = 'wrong_username';
          process.env.MAIL_USERNAME = username;
          expect(config.contact.mail.username()).to.equal(username);
        });
      });

      describe('password', () => {
        const password = '123456';

        before(() => {
          // just in case this is hanging around in a local env
          delete process.env.SPARKPOST_APIKEY;
          delete process.env.MAIL_PASSWORD;
        });

        afterEach(() => {
          delete process.env.SPARKPOST_APIKEY;
          delete process.env.MAIL_PASSWORD;
        });

        it('should exist and but be undefined by default', () => {
          expect(config.contact.mail.password).to.be.a('function');
          expect(config.contact.mail.password()).to.be.undefined;
        });

        it('should return SPARKPOST_APIKEY if defined', () => {
          process.env.SPARKPOST_APIKEY = password;
          expect(config.contact.mail.password()).to.equal(password);
        });

        it('should return MAIL_PASSWORD if defined', () => {
          process.env.SPARKPOST_APIKEY = 'wrong_password';
          process.env.MAIL_PASSWORD = password;
          expect(config.contact.mail.password()).to.equal(password);
        });
      });

      describe('mailTo', () => {
        const theMailTo = 'this@that';

        before(() => {
          // just in case this is hanging around in a local env
          delete process.env.MAIL_TO;
        });

        afterEach(() => {
          delete process.env.MAIL_TO;
        });

        it('should give different defaults based on NODE_ENV', () => {
          const defaultDev =
            configLib.create({ NODE_ENV: 'development' }).contact.mail.to();
          const defaultProd =
            configLib.create({ NODE_ENV: 'production' }).contact.mail.to();

          expect(defaultDev).to.be.a('string').that.is.not.empty;
          expect(defaultProd).to.be.a('string').that.is.not.empty;
          expect(defaultDev).to.not.equal(defaultProd);
        });

        it('should return MAIL_TO if defined', () => {
          process.env.MAIL_TO = theMailTo;
          const contact = configLib.create({ NODE_ENV: 'development' }).contact;

          expect(contact.mail.to()).to.equal(theMailTo);
        });
      });

      describe('mailFrom', () => {
        const theMailFrom = 'this@that';

        before(() => {
          // just in case this is hanging around in a local env
          delete process.env.MAIL_FROM;
        });

        afterEach(() => {
          delete process.env.MAIL_FROM;
        });

        it('should give different defaults based on NODE_ENV', () => {
          const defaultDev =
            configLib.create({ NODE_ENV: 'development' }).contact.mail.from();
          const defaultProd =
            configLib.create({ NODE_ENV: 'production' }).contact.mail.from();

          expect(defaultDev).to.be.a('string').that.is.not.empty;
          expect(defaultProd).to.be.a('string').that.is.not.empty;
          expect(defaultDev).to.not.equal(defaultProd);
        });

        it('should return MAIL_FROM if defined', () => {
          process.env.MAIL_FROM = theMailFrom;
          const contact = configLib.create({ NODE_ENV: 'development' }).contact;

          expect(contact.mail.from()).to.equal(theMailFrom);
        });
      });
    });

    describe('queue', () => {
      describe('queue.name', () => {
        const queueName = 'correct_queue';

        before(() => {
          // just in case this is hanging around in the local env
          delete process.env.QUEUE_NAME;
        });

        afterEach(() => {
          delete process.env.QUEUE_NAME;
        });

        it('should exist and have a default', () => {
          expect(config.contact.queue.name).to.be.a('function');
          expect(config.contact.queue.name()).to.be.a('string').that.is.not.empty;
        });

        it('should return QUEUE_NAME if defined', () => {
          process.env.QUEUE_NAME = queueName;
          expect(config.contact.queue.name()).to.equal(queueName);
        });
      });

      describe('queue.url', () => {
        const queueUrl = 'amqp://impossible:56754';

        before(() => {
          // just in case this is hanging around in the local env
          delete process.env.QUEUE_URL;
          delete process.env.CLOUDAMQP_URL;
        });

        afterEach(() => {
          delete process.env.QUEUE_URL;
          delete process.env.CLOUDAMQP_URL;
        });

        it('should exist and have a default', () => {
          expect(config.contact.queue.url).to.be.a('function');
          expect(config.contact.queue.url()).to.be.a('string').that.is.not.empty;
          expect(config.contact.queue.url()).to.not.equal(queueUrl);
        });

        it('should give different defaults based on NODE_ENV', () => {
          process.env.CLOUDAMQP_URL = queueUrl;

          const defaultDev =
            configLib.create({ NODE_ENV: 'development' }).contact.queue.url();

          const defaultProd =
            configLib.create({ NODE_ENV: 'production' }).contact.queue.url();

          expect(defaultDev).to.be.a('string').that.is.not.empty;
          expect(defaultProd).to.be.a('string').that.is.not.empty;

          expect(defaultProd).to.not.equal(defaultDev);
        });

        it('should return QUEUE_URL if defined', () => {
          process.env.QUEUE_URL = queueUrl;
          expect(config.contact.queue.url()).to.equal(queueUrl);
        });
      });
    });
  });

  describe('data', () => {
    describe('FRED', () => {
      it('decorates FRED url', () => {
        const config = configLib.create().data;
        const decoration = config.FRED.branchify('');
        const url = config.FRED.url();
        expect(url).to.contain(decoration);
      });

      it('changes decoration by environment', () => {
        const decoration1 =
          configLib.create({ NODE_ENV: 'production' }).data.FRED.branchify('');
        const decoration2 =
          configLib.create({ NODE_ENV: 'development' }).data.FRED.branchify('');

        expect(decoration1).to.not.equal(decoration2);
      });
    });
  });

  describe('push', () => {
    const theApiKey = 'A1S2D3F4G5H6J7K8L9';

    before(() => {
      // just in case this is hanging around in the local env
      delete process.env.PUSH_API_KEY;
      delete process.env.GCM_API_KEY;
    });

    afterEach(() => {
      delete process.env.PUSH_API_KEY;
      delete process.env.GCM_API_KEY;
    });

    function getApiKey () {
      return configLib.create().push.service.apiKey();
    }

    it('should return undefined if no env vars', () => {
      expect(getApiKey()).to.be.undefined;
    });

    it('should return a value for PUSH_API_KEY first', () => {
      process.env.PUSH_API_KEY = theApiKey;
      process.env.GCM_API_KEY = 'thisisbad';

      expect(getApiKey()).to.equal(theApiKey);
    });

    it('should return GCM_API_KEY if PUSH_API_KEY not defined', () => {
      process.env.GCM_API_KEY = theApiKey;

      assert.isUndefined(process.env.PUSH_API_KEY);
      expect(getApiKey()).to.equal(theApiKey);
    });
  });
});
