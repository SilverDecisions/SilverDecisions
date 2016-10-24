import {D3Extensions} from './d3-extensions'
import {App} from './app'
import {version} from '../package.json';
D3Extensions.extend();

App.version = version;
module.exports = App;






