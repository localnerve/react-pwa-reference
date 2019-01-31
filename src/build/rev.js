/***
 * Copyright (c) 2016 - 2019 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global Promise */
/*eslint-disable no-console */
import gulp from 'gulp';
import gulpRev from 'gulp-rev';
import fs from 'fs';
import path from 'path';
import del from 'del';
import xml2js from 'xml2js';
import utils from 'utils/node';

/**
 * Extract the basename from the path of a url, removing the rev part if it
 * exists. The result can be used for lookup in the rev manifest.
 *
 * @param {String} url - A url
 * @returns {String} The basename without revision info.
 */
function getBasenameWithoutVersion (url) {
  let baseName = path.basename(url).split('?')[0];
  const extName = path.extname(baseName);
  const nameParts = baseName.split('-');

  // If there is a rev part, it's the last - section and solid hex.
  if (nameParts.length > 0 &&
      !nameParts[nameParts.length-1].includes('x') &&
      parseInt(nameParts[nameParts.length-1], 16)) {
    nameParts.length -= 1;
    baseName = `${nameParts.join('-')}${extName}`;
  }

  return baseName;
}

/**
 * Rewrite the revved browserconfig.xml to use latest revved assets.
 * (Microsoft)
 *
 * @param {Object} revManifest - The rev manifest.
 * @param {Object} revBaseNames - The basenames of the rev manifest.
 * @param {Object} settings - The settings config.
 * @return {Promise} Resolves when the browserconfig.xml is rewritten.
 */
function rewriteBrowserConfig (revManifest, revBaseNames, settings) {
  const revvedBrowserConfig =
    `${settings.dist.baseDir}/${revManifest['browserconfig.xml']}`;

  return utils.nodeCall(fs.readFile, revvedBrowserConfig, {
    encoding: 'utf8'
  })
    .then((xmlString) => {
      return utils.nodeCall(xml2js.parseString, xmlString, {
        normalize: true
      })
        .then((jsData) => {
          const logos = jsData.browserconfig.msapplication[0].tile[0];

          Object.keys(logos).forEach((key) => {
            const item = logos[key][0];

            if (Object.prototype.toString.call(item) === '[object Object]') {
              const baseName = getBasenameWithoutVersion(item.$.src);

              if (revBaseNames[baseName]) {
                item.$.src =
                  `${settings.web.baseDir}/${revBaseNames[baseName]}`;
              }
            }
          });

          const builder = new xml2js.Builder();
          const xmlOutput = builder.buildObject(jsData);

          return utils.nodeCall(fs.writeFile, revvedBrowserConfig, xmlOutput);
        });
    });
}

/**
 * Rewrite the revved manifest.json to use the latest revved assets.
 * (Google, standard)
 *
 * @param {Object} revManifest - The rev manifest.
 * @param {Object} revBaseNames - The basenames of the rev manifest.
 * @param {Object} settings - The settings config.
 * @return {Promise} Resolves when the manifest.json is rewritten.
 */
function rewriteManifestJson (revManifest, revBaseNames, settings) {
  const revvedManifestJson =
    `${settings.dist.baseDir}/${revManifest['manifest.json']}`;

  return utils.nodeCall(fs.readFile, revvedManifestJson, {
    encoding: 'utf8'
  })
    .then((json) => {
      const jsData = JSON.parse(json);

      jsData.icons.forEach((icon) => {
        const baseName = getBasenameWithoutVersion(icon.src);
        if (revBaseNames[baseName]) {
          icon.src = `${settings.web.baseDir}/${revBaseNames[baseName]}`;
        }
      });

      return utils.nodeCall(
        fs.writeFile, revvedManifestJson, JSON.stringify(jsData)
      );
    });
}

/**
 * Rewrite revved manifest.webapp to use latest revved assets.
 * (Mozilla)
 *
 * @param {Object} revManifest - The rev manifest.
 * @param {Object} revBaseNames - The basenames of the rev manifest.
 * @param {Object} settings - The settings config.
 * @return {Promise} Resolves when the manifest.webapp is rewritten.
 */
function rewriteManifestWebapp (revManifest, revBaseNames, settings) {
  const revvedManifestWebapp =
    `${settings.dist.baseDir}/${revManifest['manifest.webapp']}`;

  return utils.nodeCall(fs.readFile, revvedManifestWebapp, {
    encoding: 'utf8'
  })
    .then((json) => {
      const jsData = JSON.parse(json);

      Object.keys(jsData.icons).forEach((key) => {
        const baseName = getBasenameWithoutVersion(jsData.icons[key]);

        if (revBaseNames[baseName]) {
          jsData.icons[key] =
            `${settings.web.baseDir}/${revBaseNames[baseName]}`;
        }
      });

      return utils.nodeCall(
        fs.writeFile, revvedManifestWebapp, JSON.stringify(jsData)
      );
    });
}

/**
 * Factory for the rev task.
 * Revision all built assets with some exceptions.
 * Generate the asset rev manifest control file.
 * Update image references in manifest files (manfiest.json, etc.)
 * Cleanup most built assets that were revisioned.
 *
 * @param {Object} settings - The project settings.
 * @returns {Function} the rev task.
 */
export default function revTaskFactory (settings) {
  return gulp.series(
    function revTask () {
      return gulp.src([
        '**',
        // rev all built assets, EXCEPT:

        // inline styles are not retrieved by browser
        '!**/styles/inline*',
        // html files are already revved or not retrieved by browser
        '!**/*.html',
        // robots is actually just a string template
        '!robots.txt',
        // scripts are handled by webpack
        '!scripts/**'
      ], {
        cwd: settings.dist.baseDir
      })
        .pipe(
          gulpRev()
        )
        .pipe(
          gulp.dest(settings.dist.baseDir)
        )
        .pipe(
          gulpRev.manifest(settings.src.assetsRevManifest)
        )
        .pipe(
          gulp.dest('.')
        );
    },
    function revTaskManifestUpdates () {
      const revManifest = JSON.parse(
        fs.readFileSync(settings.src.assetsRevManifest, {
          encoding: 'utf8'
        })
      );
      const revBaseNames = Object.keys(revManifest).reduce(
        function (prev, curr) {
          var basename = path.basename(curr);
          if (!prev[basename]) {
            prev[basename] = revManifest[curr];
          }
          return prev;
        }, Object.create(null));

      return Promise.all([
        rewriteBrowserConfig(revManifest, revBaseNames, settings),
        rewriteManifestJson(revManifest, revBaseNames, settings),
        rewriteManifestWebapp(revManifest, revBaseNames, settings)
      ]);
    },
    function revTaskCleanup () {
      const revManifest = JSON.parse(
        fs.readFileSync(settings.src.assetsRevManifest, {
          encoding: 'utf8'
        })
      );

      return del(Object.keys(revManifest).filter((file) => {
        // Filter out images that need to be available to the browser on '/'
        return !file.includes('favicon.ico');
      }), {
        cwd: settings.dist.baseDir
      });
    }
  );
}
