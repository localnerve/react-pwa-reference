/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global describe, it, before, after, beforeEach, afterEach */
const expect = require('chai').expect;

const createMockActionContext = require('fluxible/utils').createMockActionContext;
const MockService = require('fluxible-plugin-fetchr/utils/MockServiceManager');
const modelsResponse = require('test/fixtures/models-response');
const ModalStore = require('application/stores/ModalStore').ModalStore;
const ContentStore = require('application/stores/ContentStore').ContentStore;
const serviceData = require('test/mocks/service-data');
const mocks = require('test/mocks');

describe('modal action', () => {
  let mockActions, modalStartAction, modalStopAction, modalUpdateAction,
    calledService, context, params;

  before(() => {
    mocks.interface.begin();
    mocks.settings.begin();
    mockActions = require('application/actions/interface');
    modalStartAction = require('application/actions/modal').openModal;
    modalStopAction = require('application/actions/modal').closeModal;
    modalUpdateAction = require('application/actions/modal').updateComponent;
  });

  after(() => {
    mocks.settings.end();
    mocks.interface.end();
  });

  afterEach(() => {
    delete mockActions.test;
  });

  beforeEach(() => {
    calledService = 0;
    params = JSON.parse(JSON.stringify(modelsResponse.Settings));
    context = createMockActionContext({
      stores: [ModalStore, ContentStore]
    });
    context.service = new MockService();
    context.service.setService('page', (method, params, config, callback) => {
      calledService++;
      serviceData.fetch(params, callback);
    });
  });

  describe('start', () => {
    const expectedError = new Error('should have received an error');

    it('should update the ModalStore', (done) => {
      context.executeAction(modalStartAction, params, (err) => {
        if (err) {
          return done(err);
        }

        const modalStore = context.getStore(ModalStore),
          component = modalStore.getComponent(),
          props = modalStore.getProps(),
          isOpen = modalStore.getIsOpen();

        expect(isOpen).to.be.a('boolean').and.equal(true);
        expect(component).to.be.a('function');
        // this is content, models from service-data
        expect(props).to.be.an('object').with.property('content');

        done();
      });
    });

    it('should update the ContentStore', (done) => {
      context.executeAction(modalStartAction, params, (err) => {
        if (err) {
          return done(err);
        }

        const contentStore = context.getStore(ContentStore),
          content = contentStore.getCurrentPageContent(),
          models = contentStore.getCurrentPageModels();

        expect(content).to.exist.and.be.an('object');
        // this is models from fixture
        expect(models).to.eql(modelsResponse);

        done();
      });
    });

    it('should not make service call if data in ContentStore', (done) => {
      const contentStore = context.getStore(ContentStore);

      // make sure content for params.resource is there
      if (!contentStore.get(params.resource)) {
        contentStore.receivePageContent({
          resource: params.resource,
          data: serviceData.createContent(params.resource)
        });
      }

      context.executeAction(modalStartAction, params, (err) => {
        if (err) {
          return done(err);
        }

        const models = contentStore.getCurrentPageModels();

        expect(models).to.eql(modelsResponse);
        expect(calledService).to.equal(0);
        done();
      });
    });

    it('should handle customAction failure after service call', (done) => {
      let calledAction = 0;
      const localParams = Object.assign({}, params, {
        action: {
          name: 'test',
          params: {}
        }
      });

      delete localParams.split;

      mockActions.putAction('test', (context, payload, done) => {
        calledAction++;
        payload.emulateError = true;
        return mockActions.settings(context, payload, done);
      });

      context.executeAction(modalStartAction, localParams, (err) => {
        expect(calledService).to.equal(1);
        expect(calledAction).to.equal(1);

        if (err) {
          return done();
        }

        done(expectedError);
      });
    });

    it('should handle customAction failure no service call', (done) => {
      let calledAction = 0;
      const contentStore = context.getStore(ContentStore);

      // make sure content for params.resource is there
      if (!contentStore.get(params.resource)) {
        contentStore.receivePageContent({
          resource: params.resource,
          data: serviceData.createContent(params.resource)
        });
      }

      const localParams = Object.assign({}, params, {
        action: {
          name: 'test',
          params: {}
        }
      });

      delete localParams.split;

      mockActions.putAction('test', (context, payload, done) => {
        calledAction++;
        payload.emulateError = true;
        return mockActions.settings(context, payload, done);
      });

      context.executeAction(modalStartAction, localParams, (err) => {
        expect(calledService).to.equal(0);
        expect(calledAction).to.equal(1);

        if (err) {
          return done();
        }

        done(expectedError);
      });
    });

    it('should fail as expected', (done) => {
      context.executeAction(modalStartAction, {
        emulateError: true
      }, (err) => {
        if (err) {
          return done();
        }

        done(expectedError);
      });
    });

    it('should fail as expected with no data', (done) => {
      context.executeAction(modalStartAction, {
        noData: true
      }, (err) => {
        if (err) {
          return done();
        }

        done(expectedError);
      });
    });
  });

  describe('stop', () => {
    it('should update the ModalStore', (done) => {
      context.executeAction(modalStopAction, params, (err) => {
        if (err) {
          return done(err);
        }

        const modalStore = context.getStore(ModalStore),
          isOpen = modalStore.getIsOpen();

        expect(isOpen).to.equal(false);
        done();
      });
    });
  });

  describe('update', () => {
    beforeEach(() => {
      params = {
        resource: 'key',
        component: {
          test: 'hello'
        }
      };
    });

    it('should update component', (done) => {
      context.executeAction(modalUpdateAction, params, (err) => {
        if (err) {
          return done(err);
        }

        const modalStore = context.getStore(ModalStore);

        modalStore.modalStart({
          component: params.resource
        });

        const component = modalStore.getComponent();

        expect(component).to.eql(params.component);
        done();
      });
    });
  });
});
