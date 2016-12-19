var core = require('mathjs/core');

// Create a new, empty math.js instance
// It will only contain methods `import` and `config`
var math = core.create();
math.config({
    number: 'Fraction'
});
// load the data types you need.
// To load all data types:
//
//     math.import(require('mathjs/lib/type'));
//
math.import(require('mathjs/lib/type/fraction'));

// Load the functions you need.
//
// To load all functions:
//
//     math.import(require('mathjs/lib/function'));
//
// To load all functions of a specific category:
//
math.import(require('mathjs/lib/function/arithmetic'));
math.import(require('mathjs/lib/function/relational'));
//
// math.import(require('mathjs/lib/function/arithmetic/add'));
// math.import(require('mathjs/lib/function/arithmetic/subtract'));
// math.import(require('mathjs/lib/function/arithmetic/multiply'));
// math.import(require('mathjs/lib/function/arithmetic/divide'));
// math.import(require('mathjs/lib/function/utils/format'));

// Expressions:
math.import(require('mathjs/lib/expression'));
math.import(require('mathjs/lib/utils/string'));

module.exports = math;
