/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Only rendered on the server
 */
/*eslint react/no-danger:0 */
import React from 'react';
import { connectToStores, provideContext } from 'fluxible-addons-react';

let Html = React.createClass({
  propTypes: {
    currentPageTitle: React.PropTypes.string.isRequired,
    imageServiceHost: React.PropTypes.string.isRequired,
    images: React.PropTypes.string.isRequired,
    inlineStyles: React.PropTypes.string.isRequired,
    trackingSnippet: React.PropTypes.string.isRequired,
    inlineScript: React.PropTypes.string.isRequired,
    markup: React.PropTypes.string.isRequired,
    state: React.PropTypes.string.isRequired,
    mainScript: React.PropTypes.string.isRequired,
    appManifest: React.PropTypes.string.isRequired,
    otherStyles: React.PropTypes.array.isRequired,
    browserConfig: React.PropTypes.string.isRequired,
    swRegistrationScript: React.PropTypes.string.isRequired,
    swMainScript: React.PropTypes.string.isRequired
  },
  render: function () {
    const asyncStyleImports = this.props.otherStyles.map((otherStyle, i) => {
      // considering:
      // return <link rel="preload" as="style" href={otherStyle} />;
      return <meta key={'otherStyle-'+i} itemProp="stylesheet" content={otherStyle} />;
    });

    return (
      <html>
        <head>
          <meta charSet="utf-8" />
          <title>{this.props.currentPageTitle}</title>
          <meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no" />
          <meta httpEquiv="x-dns-prefetch-control" content="on" />
          <link rel="dns-prefetch" href="//fonts.gstatic.com" />
          <link rel="preconnect" href="//fonts.gstatic.com" />
          <link rel="dns-prefetch" href={this.props.imageServiceHost} />
          <link rel="preconnect" href={this.props.imageServiceHost} />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="application-name" content="Flux React Example SW" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black" />
          <meta name="apple-mobile-web-app-title" content="Flux React Example SW" />
          <link rel="apple-touch-icon" sizes="57x57" href={this.props.images + '/apple-touch-icon-57x57.png'} />
          <link rel="apple-touch-icon" sizes="60x60" href={this.props.images + '/apple-touch-icon-60x60.png'} />
          <link rel="apple-touch-icon" sizes="72x72" href={this.props.images + '/apple-touch-icon-72x72.png'} />
          <link rel="apple-touch-icon" sizes="76x76" href={this.props.images + '/apple-touch-icon-76x76.png'} />
          <link rel="apple-touch-icon" sizes="114x114" href={this.props.images + '/apple-touch-icon-114x114.png'} />
          <link rel="apple-touch-icon" sizes="120x120" href={this.props.images + '/apple-touch-icon-120x120.png'} />
          <link rel="apple-touch-icon" sizes="144x144" href={this.props.images + '/apple-touch-icon-144x144.png'} />
          <link rel="apple-touch-icon" sizes="152x152" href={this.props.images + '/apple-touch-icon-152x152.png'} />
          <link rel="apple-touch-icon" sizes="180x180" href={this.props.images + '/apple-touch-icon-180x180.png'} />
          <link rel="icon" type="image/png" href={this.props.images + '/favicon-32x32.png'} sizes="32x32" />
          <link rel="icon" type="image/png" href={this.props.images + '/android-chrome-192x192.png'} sizes="192x192" />
          <link rel="icon" type="image/png" href={this.props.images + '/favicon-96x96.png'} sizes="96x96" />
          <link rel="icon" type="image/png" href={this.props.images + '/favicon-16x16.png'} sizes="16x16" />
          <link rel="manifest" href={this.props.appManifest} />
          <meta name="msapplication-config" content={this.props.browserConfig} />
          <meta name="msapplication-TileColor" content="#1B5E20" />
          <meta name="msapplication-TileImage" content={this.props.images + '/mstile-144x144.png'} />
          <meta name="theme-color" content="#1B5E20" />
          {asyncStyleImports}
          <style dangerouslySetInnerHTML={{__html: this.props.inlineStyles}}></style>
          <script dangerouslySetInnerHTML={{__html: this.props.trackingSnippet}}></script>
          <script async src={this.props.swRegistrationScript} data-service-worker={this.props.swMainScript}></script>
        </head>
        <body>
          <script dangerouslySetInnerHTML={{__html: this.props.inlineScript}}></script>
          <section id="application" className="app-frame"
            dangerouslySetInnerHTML={{__html: this.props.markup}}>
          </section>
          <script dangerouslySetInnerHTML={{__html: this.props.state}}></script>
          <script src={this.props.mainScript}></script>
        </body>
      </html>
    );
  }
});

Html = provideContext(
  connectToStores(Html, ['ApplicationStore', 'BackgroundStore'], (context) => {
    return {
      currentPageTitle: context.getStore('ApplicationStore').getCurrentPageTitle(),
      imageServiceHost: context.getStore('BackgroundStore').getImageServiceUrl().replace(/https?\:/, '')
    };
  })
);

export default Html;
