# compile-json-stringify

[![NPM Version](https://img.shields.io/npm/v/compile-json-stringify.svg)](https://www.npmjs.com/package/compile-json-stringify)
[![Build Status](https://travis-ci.org/nwoltman/compile-json-stringify.svg?branch=master)](https://travis-ci.org/nwoltman/compile-json-stringify)
[![Coverage Status](https://coveralls.io/repos/nwoltman/compile-json-stringify/badge.svg?branch=master)](https://coveralls.io/r/nwoltman/compile-json-stringify?branch=master)

Inspired by [`fast-json-stringify`](https://github.com/fastify/fast-json-stringify), this module allows you to compile a function that will stringify a JSON payload **2x-5x faster** than `JSON.stringify()` (up to 8.5x faster in one case). To get such high performance, you compile the function with a schema that describes the shape of the data that you want to stringify.

> The difference between `compile-json-stringify` and `fast-json-stringify` is that with `fast-json-stringify` you define the shape of the _output_ data, whereas with this module you define the shape of the _input_ data.

**Table of Contents**

+ [Installation](#installation)
+ [Example Use](#example-usage)
+ [API](#api)
  + [schema](#schema)
    + [`type`](#type)
    + [`items`](#items)
    + [`properties`](#properties)
      + [Missing properties](#missing-properties)
    + [`additionalProperties`](#additionalproperties)
+ [Differences from `JSON.stringify()`](#differences-from-jsonstringify)
  + [When strict mode is off](#when-strict-mode-is-off-the-default)
  + [When strict mode is on](#when-strict-mode-is-on)
+ [Benchmark Results](#benchmark-results)


## Installation

```sh
# npm
npm install compile-json-stringify --save

# yarn
yarn add compile-json-stringify
```


## Example Usage

```js
const compileJsonStringify = require('compile-json-stringify');

const stringifyUser = compileJsonStringify({
  type: 'object',
  properties: {
    id: {type: 'number'},
    firstName: {type: 'string'},
    lastName: {type: 'string'},
  },
});

stringifyUser({
  id: 11,
  firstName: 'Jane',
  lastName: 'Ives',
}); // -> '{"id":11,"firstName":"Jane","lastName":"Ives"}'
```


## API

```js
compileJsonStringify(schema);
```

The root schema may contain the following options in addition to the options defined in the [`schema`](#schema) section:

+ `strict` - `false` by default. Set this to `true` to turn on [`strict mode`](#when-strict-mode-is-on).
+ `debug` - Set this to `true` to print out the full compiled code when a function is compiled.

### `schema`

The schema passed to `compile-json-stringify` is an object that defines the shape of the data that the compiled function will stringify. It is similar to the type of schema accepted by [`Ajv`](https://github.com/epoberezkin/ajv) and supports the following [`keywords`](https://github.com/epoberezkin/ajv#validation-keywords):

+ [`type`](#type) - Defines the data's type(s). Its value can be a string (for a single type) or an array of strings (for multiple types).
+ [`items`](#items) - Defines the type(s) of data in an `array` type. Required when `type` is/contains `'array'`.
+ [`properties`](#properties) - Defines the properties of an `object` type. Required when `type` is/contains `'object'`.
+ [`additionalProperties`](#additionalProperties) - Indicates that an `object` type has more properties than the ones defined in `properties`.

#### `type`

Defines the data's type(s). Its value can be a string (for a single type) or an array of strings (for multiple types).

The possible type strings are:

+ `null`
+ `string`
+ `number`
+ `boolean`
+ `array`
+ `object`
+ `date` - Indicates that the data type to stringify is a [`Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) object.
+ `any` - Indicates that the data could be any type. Data with this type will always be stringified with `JSON.stringify()`. If you specify this type, you may not specify any other types.

Example:

```js
{
  type: 'number',
}
// ...
{
  type: ['null', 'string']
}
```

#### `items`

Defines the type(s) of data in an `array` type. It has 2 formats:

##### all items format

```js
{
  type: 'array',
  items: {type: 'string'} // schema for all items
}
```

Use this format if the array could have any number of items.

##### tuple format

```js
{
  type: 'array',
  items: [
    {type: 'string'}, // schema for the first item
    {type: 'number'}, // schema for the second item
    // ... etc.
  ]
}
```

Use this format if you know the exact number of items that an array will have.

**Note:** With this format, only the items that are defined in the tuple will be stringified. If the array being stringified is longer than the defined tuple, all additional items will be ignored. Example:

```js
const stringify = compileJsonStringify({
  type: 'array',
  items: [
    {type: 'string'},
    {type: 'number'},
  ]
});

stringify([
  'one',
  2,
  'three',
  4,
]); // -> '["one",2]'
```

#### `properties`

Defines the properties of an `object` type. This is required when `type` is or contains `'object'`.

Example:

```js
const stringify = compileJsonStringify({
  type: 'object',
  properties: {
    name: {type: 'string'},
    age: {type: 'number'},
  }
});
```

##### Missing properties

If a property is defined in the `properties` object but is not in the data being stringified, it will not be in the resulting JSON.

```js
const stringify = compileJsonStringify({
  type: 'object',
  properties: {
    name: {type: 'string'},
    age: {type: 'number'},
    location: {type: 'string'},
  }
});

stringify({
  name: 'Jane Ives',
}); // -> '{"name":"Jane Ives"}'
```

If a property is not defined in the `properties` object, it will never be in the resulting JSON.

```js
const stringify = compileJsonStringify({
  type: 'object',
  properties: {
    name: {type: 'string'},
    age: {type: 'number'},
  }
});

stringify({
  name: 'Jane Ives',
  age: 13,
  location: 'unknown',
  abilities: ['telekinesis'],
}); // -> '{"name":"Jane Ives","age":13}'
```

#### `additionalProperties`

A boolean to indicate that an `object` type has more properties than just the ones defined in `properties`.
Defaults to `false`.

**Note:** Setting `additionalProperties` to `true` will cause the object to always be stringified with `JSON.stringify()`.


## Differences from `JSON.stringify()`

### When strict mode is OFF (the default)

The compiled function will act very similar to `JSON.stringify()`. In this mode, the schema is really just a way to hint at the types of the input date. If a part of the received data does not match what was in the schema, `JSON.stringify()` will be used to stringify that part of the data.

However, there are still 2 main differences from `JSON.stringify()`:

#### 1) Object Properties and Tuple Arrays

Objects with [missing properties](#missing-properties) and array [tuples](#tuple-format) will not have extra properties or items stringified.

#### 2) Object Pitfalls

It is possible to accidentally stringify data in the wrong way if you define a schema with only an `object` type and the compiled function gets passed an array or date object. If this happens, the array or date will be stringified in the format defined by the object schema (because arrays and dates are both objects).

Example:

```js
const stringify = compileJsonStringify({
  type: 'object',
  properties: {
    name: {type: 'string'},
    length: {type: 'number'},
  },
});

stringify(['array']); // -> '{"length":1}'
stringify(new Date()); // -> '{}'
```

Make sure to always define all possible types for both safety and the best performance.

```js
{
  type: ['date', 'array', 'object'],
  items: {type: 'string'},
  properties: {
    name: {type: 'string'},
    length: {type: 'number'},
  },
}
```

### When strict mode is ON

> **Note:** This option was originally implemented in an attempt to improve performance by avoiding extra type-checking and function calls, but [the benchmark](#benchmark-results) shows that this makes almost no difference to performance.

The same differences as when [strict mode is off](#when-strict-mode-is-off-the-default) plus the following:

The compiled function will run under the assumption that the data it receives is the right type. This means that if the data is the wrong type, it will be coerced to the expected type or an error will be thrown if the data cannot be stringified like the expected type (e.g. object properties can't be accessed on `null` or `undefined`).

If multiple types are specified, the stringifier will attempt to match the data to one of the defined types (such as `1` to `number` or `true` to `boolean`). If the data does not match any of the defined types, the stringifier will attempt to stringify the data as if it were the defined type that is the **lowest** on this list:

+ `null`
+ `string`
+ `number`
+ `boolean`
+ `date`
+ `array`
+ `object`

Example:

```js
const stringify =  compileJsonStringify({
  type: ['date', 'array'],
  items: {type: 'string'},
});

stringify(null); // -> Error
// Did not match 'date' and could not be stringified like an 'array'

stringify('string'); // -> '["s","t","r","i","n","g"]'
stringify(123); // -> '[]'
stringify(true); // -> '[]'
// Did not match 'date' so was stringified like an 'array'

stringify(new Date()); // -> '2018-01-15T21:53:15.639Z"'
// Matched 'date'

stringify(['a', 'b']); // -> '["a","b"]'
// Matched 'array'

stringify([1, 2]); // -> '["1","2"]'
// Matched 'array' and items were coerced to strings

stringify({length: 2, '1': null}); // -> '["null","undefined"]'
// Did not match 'date' so was stringified like an 'array' of strings
```


## Benchmark Results

Run on Node 9.4.0

```
1) object - JSON.stringify x 1,951,961 ops/sec ±0.63% (93 runs sampled)
1) object - compile-json-stringify x 7,918,447 ops/sec ±0.53% (97 runs sampled)
1) object - compile-json-stringify strict x 8,283,659 ops/sec ±0.51% (94 runs sampled)

2) array of objects - JSON.stringify x 32,524 ops/sec ±0.76% (96 runs sampled)
2) array of objects - compile-json-stringify x 95,166 ops/sec ±0.61% (95 runs sampled)
2) array of objects - compile-json-stringify strict x 95,651 ops/sec ±1.88% (89 runs sampled)

3) array of numbers - JSON.stringify x 2,458,982 ops/sec ±0.52% (96 runs sampled)
3) array of numbers - compile-json-stringify x 5,539,276 ops/sec ±0.42% (96 runs sampled)
3) array of numbers - compile-json-stringify strict x 5,521,954 ops/sec ±0.50% (94 runs sampled)

4) tuple - JSON.stringify x 2,910,989 ops/sec ±0.43% (96 runs sampled)
4) tuple - compile-json-stringify x 8,035,354 ops/sec ±0.52% (94 runs sampled)
4) tuple - compile-json-stringify strict x 8,080,111 ops/sec ±0.39% (96 runs sampled)

5) short string - JSON.stringify x 4,955,866 ops/sec ±0.75% (91 runs sampled)
5) short string - compile-json-stringify x 21,795,013 ops/sec ±0.45% (91 runs sampled)
5) short string - compile-json-stringify strict x 21,687,609 ops/sec ±0.45% (93 runs sampled)

6) long string - JSON.stringify x 29,296 ops/sec ±0.43% (95 runs sampled)
6) long string - compile-json-stringify x 54,528 ops/sec ±0.36% (95 runs sampled)
6) long string - compile-json-stringify strict x 54,662 ops/sec ±0.23% (98 runs sampled)

7) multiple types - JSON.stringify x 3,002,964 ops/sec ±0.40% (96 runs sampled)
7) multiple types - compile-json-stringify x 26,271,332 ops/sec ±0.48% (94 runs sampled)
7) multiple types - compile-json-stringify strict x 26,056,262 ops/sec ±0.58% (94 runs sampled)

8) multiple types in an object - JSON.stringify x 992,784 ops/sec ±0.55% (98 runs sampled)
8) multiple types in an object - compile-json-stringify x 4,765,136 ops/sec ±0.48% (96 runs sampled)
8) multiple types in an object - compile-json-stringify strict x 4,834,149 ops/sec ±0.48% (96 runs sampled)
```
