/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

function Remarkable () {
}

Remarkable.prototype.render = function (input) {
  return '<h2>'+input+'</h2>';
};

module.exports = Remarkable;
