/***
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import gulpWebPageTest from 'gulp-webpagetest';

/**
 * Factory for the perfbudget ask.
 * Runs a perfbudget against DEPLOY_URL on webpagetest.
 *
 * @returns {Function} The perfbudget task.
 */
export default function perfbudgetTaskFactory () {
  return function perfbudget (done) {
    const wpt = gulpWebPageTest ({
      url: process.env.DEPLOY_URL,
      key: process.env.WPT_API_KEY,
      location: 'Dulles:Chrome',
      firstViewOnly: true,
      timeout: 300,
      connectivity: '3G',
      emulateMobile: true,
      runs: 3,
      budget: {
        // 3000 nominal + (2 * 300) ssl negotiation
        SpeedIndex: 3600
      },
      wptInstance: 'https://www.webpagetest.org'
    });

    return wpt(done);
  }
}
