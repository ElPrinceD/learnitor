import React from 'react';

if (process.env.NODE_ENV !== 'production') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    logOnDifferentValues: true,
    titleColor: 'green',
    diffNameColor: 'aqua',
    onlyLogs: true, // prevent full diff tree unless needed
  });
}
