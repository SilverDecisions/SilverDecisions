require('es6-set/implement');
import {D3Extensions} from 'sd-tree-designer'
import {App} from './app'
import {version} from '../package.json';
D3Extensions.extend();

App.version = version;
module.exports = App;






