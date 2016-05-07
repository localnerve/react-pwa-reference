/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global afterEach, describe, it, beforeEach */
'use strict';

var expect = require('chai').expect;
var testUtils = require('react-addons-test-utils');
var RouteStore =
  require('application/stores/RouteStore').RouteStore;
var BackgroundStore =
  require('application/stores/BackgroundStore').BackgroundStore;
var HtmlComponent = require('react')
  .createFactory(require('application/components/Html').default);
var createMockComponentContext =
  require('fluxible/utils').createMockComponentContext;
// HtmlComponent never renders on the client, so dont make dom until test render
var testDom = require('test/utils/testdom');

describe('html component', function () {
  var htmlComponent;

  var testProps = {
    images: 'path/to/images',
    mainScript: 'path/to/mainScript',
    trackingSnippet: 'someTrackingCode',
    inlineStyles: '@charset "UTF-8";',
    inlineScript: 'window["MyTest"] = 0;',
    state: '123456789',
    markup: 'Hello World',
    appManifest: 'path/to/manifest.json',
    otherStyles: [
      'path/to/otherstyles1.css'
    ],
    browserConfig: 'path/to/browserConfig.xml',
    swRegistrationScript: 'path/to/service-worker-registration.js',
    swMainScript: 'service-worker.js'
  };

  /**
   * renderIntoDocument for html element.
   *
   * Replaces testUtils.renderIntoDocument.
   * renderIntoDocument no longer supports React html components as it wraps
   * everything in a div.
   * https://github.com/facebook/react/issues/5128
   *
   * Must start testDom (jsdom) first.
   *
   * @param {ReactElement} el - the html element.
   * @returns {ReactComponent} The html component.
   */
  function renderHtmlIntoDocument (el) {
    var ReactDOM = require('react-dom');
    var ReactDOMServer = require('react-dom/server');

    var iframe = global.document.createElement('iframe');

    global.document.body.appendChild(iframe);
    iframe.src = 'about:blank';
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(ReactDOMServer.renderToString(el));
    iframe.contentWindow.document.close();
    return ReactDOM.render(el, iframe.contentWindow.document);
  }

  beforeEach(function () {
    testProps.context = createMockComponentContext({
      stores: [RouteStore, BackgroundStore]
    });
    var htmlElement = HtmlComponent(testProps);

    // This enables dom render after HtmlComponent factory call.
    // This mimics what really happens.
    testDom.start();

    // Create the htmlComponent for use in tests.
    htmlComponent = renderHtmlIntoDocument(htmlElement);
  });

  afterEach(function () {
    // Remove the dom for the next HtmlComponent factory call.
    testDom.stop();
  });

  it('should render inline styles', function () {
    var component =
      testUtils.findRenderedDOMComponentWithTag(htmlComponent, 'style');
    expect(component.textContent).to.equal(testProps.inlineStyles);
  });

  it('should render a title', function () {
    var component =
      testUtils.scryRenderedDOMComponentsWithTag(htmlComponent, 'title');
    expect(component[0].textContent).to.be.empty;
  });

  it('should render a section', function () {
    var component =
      testUtils.findRenderedDOMComponentWithTag(htmlComponent, 'section');
    expect(component.textContent).to.equal(testProps.markup);
  });

  it('should render a standard app manifest', function () {
    var links =
      testUtils.scryRenderedDOMComponentsWithTag(htmlComponent, 'link');
    var manifestLink = links.filter(function (link) {
      return link.getAttribute('rel') === 'manifest';
    });

    expect(manifestLink.length).to.equal(1);
    expect(manifestLink[0].getAttribute('href')).to.equal(testProps.appManifest);
  });

  it('should render css meta holders for external stylesheet loads',
  function () {
    var metas =
      testUtils.scryRenderedDOMComponentsWithTag(htmlComponent, 'meta');
    var cssMetas = metas.filter(function (meta) {
      return meta.getAttribute('itemprop') === 'stylesheet';
    });

    expect(cssMetas.length).to.equal(1);
    expect(
      cssMetas[0].getAttribute('content')
    ).to.equal(testProps.otherStyles[0]);
  });

  it('should render multiple scripts', function () {
    var component =
      testUtils.scryRenderedDOMComponentsWithTag(htmlComponent, 'script');

    expect(component.length).to.equal(5);
    expect(component[0].textContent).to.equal(testProps.trackingSnippet);
    expect(
      component[1].getAttribute('src')
    ).to.equal(testProps.swRegistrationScript);
    expect(
      component[1].getAttribute('data-service-worker')
    ).to.equal(testProps.swMainScript);
    expect(component[2].textContent).to.equal(testProps.inlineScript);
    expect(component[3].textContent).to.equal(testProps.state);
    expect(component[4].textContent).to.be.empty;
    expect(component[4].getAttribute('src')).to.equal(testProps.mainScript);
  });
});
