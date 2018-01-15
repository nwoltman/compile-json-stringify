/* eslint-disable no-console */

'use strict';

const Benchmark = require('benchmark');

const compileJSONStringifyMaster = require('compile-json-stringify');
const compileJSONStringifyLocal = require('../compile-json-stringify');

let benchNumbers = '12345678';
let compare = false;

if (process.argv.length > 3) {
  if (process.argv[3].includes('compare')) {
    compare = true;
  } else {
    benchNumbers = process.argv[3].split(',');
  }
}
if (process.argv.length > 2) {
  if (process.argv[2].includes('compare')) {
    compare = true;
  } else {
    benchNumbers = process.argv[2].split(',');
  }
}

const config = new Set(benchNumbers);
const suite = new Benchmark.Suite();

const objectSchema = {
  type: 'object',
  properties: {
    id: {type: 'number'},
    name: {type: 'string'},
    isAdmin: {type: 'boolean'},
  },
};
const object = {
  id: 11011211,
  name: 'Jane Ives',
  isAdmin: false,
};

if (config.has('1')) {
  const stringifyMaster = compileJSONStringifyMaster(objectSchema);
  const stringifyLocal = compileJSONStringifyLocal(objectSchema);
  const objectSchemaCoercion = Object.assign({coerceTypes: true}, objectSchema);
  const stringifyMasterCoerce = compileJSONStringifyMaster(objectSchemaCoercion);
  const stringifyLocalCoerce = compileJSONStringifyLocal(objectSchemaCoercion);

  suite
    .add('1) object - JSON.stringify', () => {
      JSON.stringify(object);
    })
    .add('1) object - compile-json-stringify master', () => {
      stringifyMaster(object);
    })
    .add('1) object - compile-json-stringify local', () => {
      stringifyLocal(object);
    })
    .add('1) object - compile-json-stringify coerceTypes master', () => {
      stringifyMasterCoerce(object);
    })
    .add('1) object - compile-json-stringify coerceTypes local', () => {
      stringifyLocalCoerce(object);
    });
}

if (config.has('2')) {
  const arraySchema = {
    type: 'array',
    items: objectSchema,
  };
  const stringifyMaster = compileJSONStringifyMaster(arraySchema);
  const stringifyLocal = compileJSONStringifyLocal(arraySchema);
  arraySchema.coerceTypes = true;
  const stringifyMasterCoerce = compileJSONStringifyMaster(arraySchema);
  const stringifyLocalCoerce = compileJSONStringifyLocal(arraySchema);

  const array = new Array(100).fill(object);

  suite
    .add('2) array of objects - JSON.stringify', () => {
      JSON.stringify(array);
    })
    .add('2) array of objects - compile-json-stringify master', () => {
      stringifyMaster(array);
    })
    .add('2) array of objects - compile-json-stringify local', () => {
      stringifyLocal(array);
    })
    .add('2) array of objects - compile-json-stringify coerceTypes master', () => {
      stringifyMasterCoerce(array);
    })
    .add('2) array of objects - compile-json-stringify coerceTypes local', () => {
      stringifyLocalCoerce(array);
    });
}

if (config.has('3')) {
  const arraySchema = {
    type: 'array',
    items: {type: 'number'},
  };
  const stringifyMaster = compileJSONStringifyMaster(arraySchema);
  const stringifyLocal = compileJSONStringifyLocal(arraySchema);
  arraySchema.coerceTypes = true;
  const stringifyMasterCoerce = compileJSONStringifyMaster(arraySchema);
  const stringifyLocalCoerce = compileJSONStringifyLocal(arraySchema);

  const array = [1, 255, 3, 4, 5608, 6, 7, 895166, 9];

  suite
    .add('3) array of numbers - JSON.stringify', () => {
      JSON.stringify(array);
    })
    .add('3) array of numbers - compile-json-stringify master', () => {
      stringifyMaster(array);
    })
    .add('3) array of numbers - compile-json-stringify local', () => {
      stringifyLocal(array);
    })
    .add('3) array of numbers - compile-json-stringify coerceTypes master', () => {
      stringifyMasterCoerce(array);
    })
    .add('3) array of numbers - compile-json-stringify coerceTypes local', () => {
      stringifyLocalCoerce(array);
    });
}

if (config.has('4')) {
  const tupleSchema = {
    type: 'array',
    items: [
      {type: 'number'},
      {type: 'string'},
      {type: 'boolean'},
    ],
  };
  const stringifyMaster = compileJSONStringifyMaster(tupleSchema);
  const stringifyLocal = compileJSONStringifyLocal(tupleSchema);
  tupleSchema.coerceTypes = true;
  const stringifyMasterCoerce = compileJSONStringifyMaster(tupleSchema);
  const stringifyLocalCoerce = compileJSONStringifyLocal(tupleSchema);

  const tuple = [20000, 'leagues', true];

  suite
    .add('4) tuple - JSON.stringify', () => {
      JSON.stringify(tuple);
    })
    .add('4) tuple - compile-json-stringify master', () => {
      stringifyMaster(tuple);
    })
    .add('4) tuple - compile-json-stringify local', () => {
      stringifyLocal(tuple);
    })
    .add('4) tuple - compile-json-stringify coerceTypes master', () => {
      stringifyMasterCoerce(tuple);
    })
    .add('4) tuple - compile-json-stringify coerceTypes local', () => {
      stringifyLocalCoerce(tuple);
    });
}

const stringifyStringMaster = compileJSONStringifyMaster({type: 'string'});
const stringifyStringLocal = compileJSONStringifyLocal({type: 'string'});
const stringifyStringMasterSafe = compileJSONStringifyMaster({type: 'string', coerceTypes: true});
const stringifyStringLocalSafe = compileJSONStringifyLocal({type: 'string', coerceTypes: true});

if (config.has('5')) {
  const shortString = 'A short string';

  suite
    .add('5) short string - JSON.stringify', () => {
      JSON.stringify(shortString);
    })
    .add('5) short string - compile-json-stringify master', () => {
      stringifyStringMaster(shortString);
    })
    .add('5) short string - compile-json-stringify local', () => {
      stringifyStringLocal(shortString);
    })
    .add('5) short string - compile-json-stringify coerceTypes master', () => {
      stringifyStringMasterSafe(shortString);
    })
    .add('5) short string - compile-json-stringify coerceTypes local', () => {
      stringifyStringLocalSafe(shortString);
    });
}

if (config.has('6')) {
  const longString = 'You have my bow.'.repeat(1000);

  suite
    .add('6) long string - JSON.stringify', () => {
      JSON.stringify(longString);
    })
    .add('6) long string - compile-json-stringify master', () => {
      stringifyStringMaster(longString);
    })
    .add('6) long string - compile-json-stringify local', () => {
      stringifyStringLocal(longString);
    })
    .add('6) long string - compile-json-stringify coerceTypes master', () => {
      stringifyStringMasterSafe(longString);
    })
    .add('6) long string - compile-json-stringify coerceTypes local', () => {
      stringifyStringLocalSafe(longString);
    });
}

if (config.has('7')) {
  const schema = {
    type: ['null', 'string'],
  };
  const stringifyMaster = compileJSONStringifyMaster(schema);
  const stringifyLocal = compileJSONStringifyLocal(schema);
  schema.coerceTypes = true;
  const stringifyMasterCoerce = compileJSONStringifyMaster(schema);
  const stringifyLocalCoerce = compileJSONStringifyLocal(schema);

  const typeA = null;
  const typeB = 'firstName';

  suite
    .add('7) multiple types - JSON.stringify', () => {
      JSON.stringify(typeA);
      JSON.stringify(typeB);
    })
    .add('7) multiple types - compile-json-stringify master', () => {
      stringifyMaster(typeA);
      stringifyMaster(typeB);
    })
    .add('7) multiple types - compile-json-stringify local', () => {
      stringifyLocal(typeA);
      stringifyLocal(typeB);
    })
    .add('7) multiple types - compile-json-stringify coerceTypes master', () => {
      stringifyMasterCoerce(typeA);
      stringifyMasterCoerce(typeB);
    })
    .add('7) multiple types - compile-json-stringify coerceTypes local', () => {
      stringifyLocalCoerce(typeA);
      stringifyLocalCoerce(typeB);
    });
}

if (config.has('8')) {
  const schema = {
    type: 'object',
    properties: {
      id: {type: 'number'},
      name: {type: ['null', 'string']},
      phone: {type: ['null', 'number']},
    },
  };
  const stringifyMaster = compileJSONStringifyMaster(schema);
  const stringifyLocal = compileJSONStringifyLocal(schema);
  schema.coerceTypes = true;
  const stringifyMasterCoerce = compileJSONStringifyMaster(schema);
  const stringifyLocalCoerce = compileJSONStringifyLocal(schema);

  const objectA = {
    id: 11,
    name: null,
    phone: null,
  };
  const objectB = {
    id: 100,
    name: 'Jim Hopper',
    phone: 1234567890,
  };

  suite
    .add('8) multiple types in an object - JSON.stringify', () => {
      JSON.stringify(objectA);
      JSON.stringify(objectB);
    })
    .add('8) multiple types in an object - compile-json-stringify master', () => {
      stringifyMaster(objectA);
      stringifyMaster(objectB);
    })
    .add('8) multiple types in an object - compile-json-stringify local', () => {
      stringifyLocal(objectA);
      stringifyLocal(objectB);
    })
    .add('8) multiple types in an object - compile-json-stringify coerceTypes master', () => {
      stringifyMasterCoerce(objectA);
      stringifyMasterCoerce(objectB);
    })
    .add('8) multiple types in an object - compile-json-stringify coerceTypes local', () => {
      stringifyLocalCoerce(objectA);
      stringifyLocalCoerce(objectB);
    });
}

let lastNumber = '';

suite.filter(compare
  ? ({name}) => !name.includes('JSON')
  : ({name}) => !name.includes('master')
)
  .on('cycle', (event) => {
    const eventString = event.target.toString();
    const eventNumber = eventString[0];
    if (eventNumber !== lastNumber) {
      console.log();
      lastNumber = eventNumber;
    }
    console.log(eventString);
  })
  .on('complete', () => {
    console.log();
  })
  .run();
