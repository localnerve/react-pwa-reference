/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * The actions that are eligible to be referenced from the backend data service.
 *
 * This interface can be (and is) augmented dynamically as the backend defines
 * lazy loaded actions (and components, etc) it is interested in using.
 * @see utils/splits.js
 * @see actions/modal.js
 */
'use strict';

module.exports = {
  page: require('./page')
};
