/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it, beforeEach */
'use strict';

var expect = require('chai').expect;
var ApplicationStore = require('../../../stores/ApplicationStore').ApplicationStore;

describe('application store', function () {
  var storeInstance;
  var defaultName = 'default';
  var page = { title: 'Fluxible Rocks' };
  var payload = {
    page: {
      defaultPageName: defaultName
    }
  };

  beforeEach(function () {
    storeInstance = new ApplicationStore();
  });

  it('should instantiate correctly', function () {
    expect(storeInstance).to.be.an('object');
    expect(storeInstance.defaultPageName).to.equal('');
    expect(storeInstance.currentPageTitle).to.equal('');
  });

  it('should update page title', function () {
    storeInstance.updatePageTitle(page);
    expect(storeInstance.getCurrentPageTitle()).to.equal(page.title);
  });

  it('should update default page name', function () {
    storeInstance.initApplication(payload);
    expect(storeInstance.getDefaultPageName()).to.equal(defaultName);
  });

  it('should dehydrate', function () {
    storeInstance.initApplication(payload);
    storeInstance.updatePageTitle(page);

    var state = storeInstance.dehydrate();

    expect(state.defaultPageName).to.equal(defaultName);
    expect(state.pageTitle).to.equal(page.title);
  });

  it('should rehydrate', function () {
    var state = {
      defaultPageName: defaultName,
      pageTitle: page.title
    };

    storeInstance.rehydrate(state);

    expect(storeInstance.getDefaultPageName()).to.equal(defaultName);
    expect(storeInstance.getCurrentPageTitle()).to.equal(page.title);
  });
});
