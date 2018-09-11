import "@babel/polyfill";

import { configure } from '@storybook/react';

function loadStories() {
  require('../stories/');
  // You can require as many stories as you need.
}

configure(loadStories, module);
