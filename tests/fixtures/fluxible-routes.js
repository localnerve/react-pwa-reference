/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * NOTE: Only used in transformer tests.
 * Used in transformer tests = Can't use transformer to generate from fixture.
 *
 * Could partially generate from backend, but must supply action closures manually.
 */
'use strict';

var actions = require('../../actions/interface');

var params = {
  resource: 'test',
  key: '/path/to/test',
  pageTitle: 'A Test Title'
};

var action = actions.page;

// This code is symbolicly compared to method in fluxibleRouteTransformer
function makeAction () {
  var copyParams = JSON.parse(JSON.stringify(params));
  return function dynAction (context, payload, done) {
    context.executeAction(action, copyParams, done);
  };
}

module.exports = {
  home: {
    path: '/',
    method: 'get',
    page: 'home',
    label: 'Home',
    component: 'ContentPage',
    order: 0,
    priority: 1,
    background: '3',
    mainNav: true,
    action: makeAction()
  },
  about: {
    path: '/about',
    method: 'get',
    page: 'about',
    label: 'About',
    component: 'ContentPage',
    mainNav: true,
    background: '4',
    order: 1,
    priority: 1,
    action: makeAction()
  },
  contact: {
    path: '/contact',
    method: 'get',
    page: 'contact',
    label: 'Contact',
    component: 'Contact',
    mainNav: true,
    background: '5',
    order: 2,
    priority: 1,
    action: makeAction()
  }
};
