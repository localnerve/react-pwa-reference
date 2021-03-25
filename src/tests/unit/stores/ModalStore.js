/**
 * Copyright (c) 2016 - 2021 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it, beforeEach */
'use strict';

var expect = require('chai').expect;
var ModalStore = require('application/stores/ModalStore').ModalStore;

describe('modal store', function () {
  var storeInstance,
    payload = {
      props: {
        content: 'hello'
      },
      component: 'Settings'
    },
    dummyObject = {
      name: 'dummy'
    };

  beforeEach(function () {
    storeInstance = new ModalStore();
  });

  it('should instantiate correctly', function () {
    expect(storeInstance).to.be.an('object');
    expect(storeInstance.isOpen).to.equal(false);
    expect(storeInstance.currentComponent).to.equal('');
    expect(storeInstance.components).to.be.an('object').that.is.empty;
    expect(storeInstance.failure).to.equal(false);
    expect(storeInstance.props).to.equal(null);
  });

  describe('start', function () {
    it('should update component', function () {
      storeInstance.modalStart(payload);
      expect(storeInstance.currentComponent).to.equal(payload.component);
    });

    it('should update props', function () {
      storeInstance.modalStart(payload);
      expect(storeInstance.getProps()).to.equal(payload.props);
    });

    it('should update isOpen', function () {
      storeInstance.modalStart(payload);
      expect(storeInstance.getIsOpen()).to.equal(true);
    });

    it('should update componentName', function () {
      storeInstance.modalStart(payload);
      expect(storeInstance.getComponentName()).to.equal(payload.component);
    });

    it('should update failure to false', function () {
      storeInstance.modalStart(payload);
      expect(storeInstance.getFailure()).to.equal(false);
    });

    it('should not update if already open', function () {
      var invalidComponent = 'invalid';

      storeInstance.modalStart(payload);
      expect(storeInstance.getIsOpen()).to.equal(true);

      storeInstance.modalStart({
        component: invalidComponent
      });
      expect(storeInstance.currentComponent).to.equal(payload.component);
    });
  });

  describe('stop', function () {
    it('should update isOpen', function () {
      storeInstance.modalStart(payload);
      expect(storeInstance.getIsOpen()).to.equal(true);
      storeInstance.modalStop();
      expect(storeInstance.getIsOpen()).to.equal(false);
      expect(storeInstance.getFailure()).to.equal(false);
    });
  });

  describe('update', function () {
    it('should update the component', function () {
      storeInstance.modalStart(payload);
      storeInstance.updateComponent({
        resource: payload.component,
        component: dummyObject
      });
      expect(storeInstance.getComponent()).to.eql(dummyObject);
    });

    it('should update the props', function () {
      storeInstance.modalStart(payload);
      storeInstance.updateProps({
        data: dummyObject
      });
      expect(storeInstance.getProps()).to.eql(dummyObject);
    });
  });

  it('should dehydrate', function () {
    storeInstance.modalStart(payload);
    storeInstance.updateComponent({
      resource: payload.component,
      component: dummyObject
    });

    var state = storeInstance.dehydrate();

    expect(state.isOpen).to.equal(true);
    expect(state.currentComponent).to.equal(payload.component);
    expect(state.components).to.not.be.empty;
    expect(state.components[payload.component]).to.eql(dummyObject);
    expect(state.props).to.eql(payload.props);
    expect(state.failure).to.equal(false);
  });

  it('should rehydrate', function () {
    var state = {
      isOpen: false,
      failure: true,
      components: {},
      currentComponent: payload.component,
      props: payload.props
    };
    state.components[payload.component] = dummyObject;

    storeInstance.rehydrate(state);

    expect(storeInstance.getIsOpen()).to.equal(false);
    expect(storeInstance.currentComponent).to.equal(payload.component);
    expect(storeInstance.getComponent()).to.eql(dummyObject);
    expect(storeInstance.getProps()).to.eql(payload.props);
    expect(storeInstance.getFailure()).to.equal(true);
  });
});
