/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import ReactSpinner from 'react-spinner';

const Spinner = React.createClass({
  render: function () {
    return (
      <div style={{width: '100%', marginTop: '40%'}} key="spinner">
        <ReactSpinner className="react-spinner-custom" />
      </div>
    );
  }
});

export default Spinner;
