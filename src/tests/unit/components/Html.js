/**
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file
 * for terms.
 */
/* global afterEach, describe, it, beforeEach */
import { expect } from 'chai';
import React from 'react';
import testUtils from 'react-addons-test-utils';
import { RouteStore } from 'application/stores/RouteStore';
import { BackgroundStore } from 'application/stores/BackgroundStore';
import html from 'application/components/Html';
import { createMockComponentContext } from 'fluxible/utils';
// HtmlComponent never renders on the client, so dont make dom until test render
import { start as testDomStart, stop as testDomStop } from 'test/utils/testdom';

describe('html component', () => {
  let htmlComponent;

  const testProps = {
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
    swMainScript: 'service-worker.js',
    revAsset: (asset) => asset
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
    const ReactDOM = require('react-dom');
    const ReactDOMServer = require('react-dom/server');

    const iframe = global.document.createElement('iframe');

    global.document.body.appendChild(iframe);
    iframe.src = 'about:blank';
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(ReactDOMServer.renderToString(el));
    iframe.contentWindow.document.close();

    /* eslint-disable react/no-render-return-value */
    return ReactDOM.render(el, iframe.contentWindow.document);
    /* eslint-enable react/no-render-return-value */
  }

  beforeEach(() => {
    testProps.context = createMockComponentContext({
      stores: [RouteStore, BackgroundStore]
    });
    const htmlElement = React.createFactory(html)(testProps);

    // This enables dom render after HtmlComponent factory call.
    // This mimics what really happens.
    testDomStart();

    // Create the htmlComponent for use in tests.
    htmlComponent = renderHtmlIntoDocument(htmlElement);
  });

  afterEach(() => {
    // Remove the dom for the next HtmlComponent factory call.
    testDomStop();
  });

  it('should render inline styles', () => {
    const component =
      testUtils.findRenderedDOMComponentWithTag(htmlComponent, 'style');
    expect(component.textContent).to.equal(testProps.inlineStyles);
  });

  it('should render a title', () => {
    const component =
      testUtils.scryRenderedDOMComponentsWithTag(htmlComponent, 'title');
    expect(component[0].textContent).to.be.empty;
  });

  it('should render a section', () => {
    const component =
      testUtils.findRenderedDOMComponentWithTag(htmlComponent, 'section');
    expect(component.textContent).to.equal(testProps.markup);
  });

  it('should render a standard app manifest', () => {
    const links =
      testUtils.scryRenderedDOMComponentsWithTag(htmlComponent, 'link');
    const manifestLink = links.filter((link) => {
      return link.getAttribute('rel') === 'manifest';
    });

    expect(manifestLink.length).to.equal(1);
    expect(testProps.appManifest)
      .to.contain(manifestLink[0].getAttribute('href'));
  });

  it('should render css meta holders for external stylesheet loads', () => {
    const metas =
      testUtils.scryRenderedDOMComponentsWithTag(htmlComponent, 'meta');
    const cssMetas = metas.filter((meta) => {
      return meta.getAttribute('itemprop') === 'stylesheet';
    });

    expect(cssMetas.length).to.equal(1);
    expect(
      testProps.otherStyles[0]
    ).to.contain(cssMetas[0].getAttribute('content'));
  });

  it('should render multiple scripts', () => {
    const component =
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
