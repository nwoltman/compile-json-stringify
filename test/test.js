'use strict';

const should = require('should');
const sinon = require('sinon');

const compileJSONStringify = require('../compile-json-stringify');

describe('compile-json-stringify', () => {

  it('should throw if a schema is not an object', () => {
    (() => compileJSONStringify()).should.throw();
    (() => compileJSONStringify(null)).should.throw();
    (() => compileJSONStringify('string')).should.throw();

    (() => compileJSONStringify({
      type: 'object',
      properties: {
        name: null,
      },
    })).should.throw();

    (() => compileJSONStringify({
      type: 'object',
      properties: {
        name: undefined,
      },
    })).should.throw();

    (() => compileJSONStringify({
      type: 'object',
      properties: {
        name: 'string',
      },
    })).should.throw();
  });

  it('should throw if schema.type is not valid', () => {
    (() => compileJSONStringify({type: undefined})).should.throw();
    (() => compileJSONStringify({type: null})).should.throw();
    (() => compileJSONStringify({type: 'invalid'})).should.throw();
    (() => compileJSONStringify({type: []})).should.throw();
    (() => compileJSONStringify({type: ['any']})).should.throw();
    (() => compileJSONStringify({type: [null]})).should.throw();
    (() => compileJSONStringify({type: {}})).should.throw();
    (() => compileJSONStringify({type: true})).should.throw();
  });

  it('should throw if array "items" value is not valid', () => {
    (() => compileJSONStringify({
      type: 'array',
    })).should.throw();

    (() => compileJSONStringify({
      type: 'array',
      items: null,
    })).should.throw();

    (() => compileJSONStringify({
      type: 'array',
      items: 'string',
    })).should.throw();

    (() => compileJSONStringify({
      type: 'array',
      items: [{type: 'number'}, undefined],
    })).should.throw();

    (() => compileJSONStringify({
      type: 'array',
      items: [{type: 'number'}, null],
    })).should.throw();

    (() => compileJSONStringify({
      type: 'array',
      items: [{type: 'number'}, 'string'],
    })).should.throw();
  });

  it('should throw if object "properties" value is not an object', () => {
    (() => compileJSONStringify({
      type: 'object',
    })).should.throw();

    (() => compileJSONStringify({
      type: 'object',
      properties: null,
    })).should.throw();

    (() => compileJSONStringify({
      type: 'object',
      properties: 'string',
    })).should.throw();
  });

  it('should be able to output debug information', () => {
    const stub = sinon.stub(console, 'log');

    compileJSONStringify({
      debug: true,
      type: 'boolean',
    });

    stub.args.should.have.length(1);
    stub.args[0].should.have.length(1);
    stub.args[0][0].should.have.type('string');

    stub.restore();
  });


  [false, true].forEach((coerceTypes) => {

    describe(`when 'coerceTypes' is ${coerceTypes}`, () => {

      it('should stringify null', () => {
        const stringify = compileJSONStringify({
          coerceTypes,
          type: 'null',
        });

        stringify(null).should.equal('null');
      });

      it('should stringify strings', () => {
        const stringify = compileJSONStringify({
          coerceTypes,
          type: 'string',
        });

        stringify('hello').should.equal('"hello"');

        var str = `
          this string has "quotes"
          backslashes \\
          and other characters \u0000 \u0001 \t
        `;
        stringify(str).should.equal(JSON.stringify(str));
      });

      it('should stringify numbers', () => {
        const stringify = compileJSONStringify({
          coerceTypes,
          type: 'number',
        });

        stringify(0).should.equal('0');
        stringify(-0).should.equal('0');
        stringify(10).should.equal('10');
        stringify(NaN).should.equal('null');
        stringify(Infinity).should.equal('null');
        stringify(-Infinity).should.equal('null');
      });

      it('should stringify booleans', () => {
        const stringify = compileJSONStringify({
          coerceTypes,
          type: 'boolean',
        });

        stringify(true).should.equal('true');
        stringify(false).should.equal('false');
      });

      it('should stringify dates', () => {
        const stringify = compileJSONStringify({
          coerceTypes,
          type: 'date',
        });

        const date = new Date();
        stringify(date).should.equal(JSON.stringify(date));
      });

      it('should stringify unbounded arrays', () => {
        const stringify = compileJSONStringify({
          coerceTypes,
          type: 'array',
          items: {type: 'number'},
        });

        stringify([1, 2, 3]).should.equal('[1,2,3]');
      });

      it('should stringify tuple arrays', () => {
        const stringify = compileJSONStringify({
          coerceTypes,
          type: 'array',
          items: [
            {type: 'null'},
            {type: 'string'},
            {type: 'number'},
            {type: 'boolean'},
            {type: 'date'},
            {type: 'any'},
          ],
        });

        const array = [
          null,
          'str',
          1,
          false,
          new Date(),
          {toJSON: () => 'json'},
        ];
        stringify(array).should.equal(JSON.stringify(array));
      });

      it('should stringify objects', () => {
        const stringify = compileJSONStringify({
          coerceTypes,
          type: 'object',
          properties: {
            id: {type: 'number'},
            name: {type: 'string'},
          },
        });

        stringify({
          id: 11,
          name: 'Jane Ives',
        }).should.equal('{"id":11,"name":"Jane Ives"}');
      });

      it('should stringify the `any` type', () => {
        const stringify = compileJSONStringify({
          coerceTypes,
          type: 'any',
        });

        stringify({toJSON: () => 'json'}).should.equal('"json"');
      });

      it('should stringify multiple types', () => {
        const stringify = compileJSONStringify({
          coerceTypes,
          type: [
            'null',
            'string',
            'number',
            'boolean',
            'date',
            'array',
            'object',
          ],
          items: {type: ['number', 'boolean']},
          properties: {
            id: {type: 'number'},
          },
        });
        const date = new Date();

        stringify(null).should.equal('null');
        stringify('string').should.equal('"string"');
        stringify(27).should.equal('27');
        stringify(true).should.equal('true');
        stringify(date).should.equal(JSON.stringify(date));
        stringify([1, 3, true, false]).should.equal('[1,3,true,false]');
        stringify({id: 11}).should.equal('{"id":11}');
      });

      it('should stringify multiple types / 2', () => {
        const stringify = compileJSONStringify({
          coerceTypes,
          type: ['null', 'array'],
          items: {type: 'string'},
        });

        stringify(null).should.equal('null');
        stringify(['a', '"']).should.equal('["a","\\""]');
      });

      it('should stringify nested objects', () => {
        const stringify = compileJSONStringify({
          coerceTypes,
          type: 'object',
          properties: {
            id: {type: 'number'},
            friends: {
              type: 'array',
              items: {type: 'number'},
            },
            extra: {
              type: 'object',
              properties: {
                ability: {type: 'string'},
                interest: {
                  type: 'object',
                  properties: {
                    name: {type: 'string'},
                  },
                },
              },
            },
          },
        });

        const obj = {
          id: 11,
          friends: [1, 2, 3, 4, 8],
          extra: {
            ability: 'telekinesis',
            interest: {name: 'Mike'},
          },
        };
        stringify(obj).should.equal(JSON.stringify(obj));
      });

      it('should stringify nested arrays', () => {
        const stringify = compileJSONStringify({
          coerceTypes,
          type: 'array',
          items: [
            {
              name: 'matrix',
              type: 'array',
              items: {
                type: 'array',
                items: {type: 'number'},
              },
            },
            {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  x: {type: 'number'},
                  y: {type: 'number'},
                },
              },
            },
            {
              type: 'object',
              properties: {
                last: {type: 'string'},
              },
            },
          ],
        });

        const array = [
          [
            [-1, 2, 3],
            [0, 0, 0],
          ],
          [{x: 1, y: 2}, {x: 0, y: -1}],
          {last: 'one'},
        ];
        stringify(array).should.equal(JSON.stringify(array));
      });

      it('should work with separate arrays with the same shape', () => {
        const stringify = compileJSONStringify({
          coerceTypes,
          type: 'array',
          items: [
            {
              type: 'array',
              items: {type: 'number'},
            },
            {
              type: 'array',
              items: {type: 'number'},
            },
          ],
        });

        const array = [
          [-1, 2, 3],
          [0, 0, 0],
        ];
        stringify(array).should.equal(JSON.stringify(array));
      });


      describe('when stringifing objects', () => {

        it('should escape keys with special characters', () => {
          const stringify = compileJSONStringify({
            coerceTypes,
            type: 'object',
            properties: {
              '\0 \u0001\n " \\': {type: 'number'},
            },
          });

          const obj = {
            '\0 \u0001\n " \\': 1,
          };
          stringify(obj).should.equal(JSON.stringify(obj));
        });

        it('should output properties in the order that they are defined in the schema', () => {
          const stringify = compileJSONStringify({
            coerceTypes,
            type: 'object',
            properties: {
              id: {type: 'number'},
              name: {type: 'string'},
            },
          });

          stringify({
            name: 'Jane',
            id: 11,
          }).should.equal('{"id":11,"name":"Jane"}');
        });

        it('should exlude properties that are not in the schema', () => {
          const stringify = compileJSONStringify({
            coerceTypes,
            type: 'object',
            properties: {
              id: {type: 'number'},
            },
          });

          stringify({
            id: 1,
            other: 'value',
          }).should.equal('{"id":1}');
        });

        it('should not include properties that are in the schema but not in the provided data', () => {
          const stringify = compileJSONStringify({
            coerceTypes,
            type: 'object',
            properties: {
              id: {type: 'number'},
            },
          });

          stringify({}).should.equal('{}');
        });

        it('should use JSON.stringify() if `additionalProperties` is truthy', () => {
          const stringify = compileJSONStringify({
            coerceTypes,
            type: 'object',
            properties: {
              id: {type: 'number'},
            },
            additionalProperties: true,
          });
          const obj = {
            id: 1,
            other: {toJSON: () => 'value'},
          };
          stringify(obj).should.equal(JSON.stringify(obj));

          const stringify2 = compileJSONStringify({
            coerceTypes,
            type: 'object',
            properties: {
              obj: {
                type: ['number', 'object'],
                properties: {},
                additionalProperties: true,
              },
            },
          });
          const obj2 = {
            obj: {
              id: 1,
              other: {toJSON: () => 'value'},
            },
          };
          stringify2(obj2).should.equal(JSON.stringify(obj2));
          stringify2({obj: 2}).should.equal('{"obj":2}');
        });

      });

    });

  });


  describe('additionally, when type coercion mode is OFF', () => {

    it('should not mistake `null` for an object', () => {
      const stringify = compileJSONStringify({
        type: 'object',
        properties: {
          id: {type: 'number'},
        },
      });

      stringify(null).should.equal('null');
    });

    it('should still stringify the value correctly even if it is the wrong type', () => {
      const stringify = compileJSONStringify({
        type: 'object',
        properties: {
          id: {type: 'number'},
        },
      });
      const date = new Date();

      stringify(null).should.equal('null');
      stringify('string').should.equal('"string"');
      stringify(-1).should.equal('-1');
      stringify(false).should.equal('false');

      /* Dates and Arrays don't work because they are objects */
      // stringify(date).should.equal(JSON.stringify(date));
      // stringify([]).should.equal('[]');

      should(stringify(undefined)).be.undefined();
      should(stringify(() => {})).be.undefined();
      should(stringify(Symbol())).be.undefined();

      stringify({id: null}).should.equal('{"id":null}');
      stringify({id: 'string'}).should.equal('{"id":"string"}');
      stringify({id: false}).should.equal('{"id":false}');
      stringify({id: date}).should.equal(JSON.stringify({id: date}));
      stringify({id: [1, null, false, {}]}).should.equal('{"id":[1,null,false,{}]}');
      stringify({id: {a: 'b'}}).should.equal('{"id":{"a":"b"}}');
      stringify({id: {toJSON: () => 'json'}}).should.equal('{"id":"json"}');

      stringify({id: undefined}).should.equal('{}');
      stringify({id: () => {}}).should.equal('{}');
      stringify({id: Symbol()}).should.equal('{}');
    });

  });


  describe('additionally, when type coercion mode is ON', () => {

    it('should stringify data as if it were the defined type', () => {
      const stringifyNull = compileJSONStringify({
        coerceTypes: true,
        type: 'null',
      });
      stringifyNull('string').should.equal('null');
      stringifyNull(1).should.equal('null');
      stringifyNull(true).should.equal('null');
      stringifyNull(new Date()).should.equal('null');
      stringifyNull([]).should.equal('null');
      stringifyNull({}).should.equal('null');
      stringifyNull(undefined).should.equal('null');
      stringifyNull(() => {}).should.equal('null');
      stringifyNull(Symbol()).should.equal('null');

      const stringifyString = compileJSONStringify({
        coerceTypes: true,
        type: 'string',
      });
      const date = new Date();
      stringifyString(null).should.equal('"null"');
      stringifyString(1).should.equal('"1"');
      stringifyString(0).should.equal('"0"');
      stringifyString(true).should.equal('"true"');
      stringifyString(false).should.equal('"false"');
      stringifyString(date).should.equal('"' + date + '"');
      stringifyString([2, 3]).should.equal('"2,3"');
      stringifyString({}).should.equal('"[object Object]"');
      stringifyString(undefined).should.equal('"undefined"');
      stringifyString(() => {}).should.equal('"() => {}"');

      const stringifyNumber = compileJSONStringify({
        coerceTypes: true,
        type: 'number',
      });
      stringifyNumber(null).should.equal('null');
      stringifyNumber('string').should.equal('null');
      stringifyNumber(true).should.equal('null');
      stringifyNumber(new Date()).should.equal('null');
      stringifyNumber([]).should.equal('null');
      stringifyNumber({}).should.equal('null');
      stringifyNumber(undefined).should.equal('null');
      stringifyNumber(() => {}).should.equal('null');
      stringifyNumber(Symbol()).should.equal('null');

      const stringifyBoolean = compileJSONStringify({
        coerceTypes: true,
        type: 'boolean',
      });
      stringifyBoolean(null).should.equal('false');
      stringifyBoolean('').should.equal('false');
      stringifyBoolean('string').should.equal('true');
      stringifyBoolean(1).should.equal('true');
      stringifyBoolean(0).should.equal('false');
      stringifyBoolean(new Date()).should.equal('true');
      stringifyBoolean([]).should.equal('true');
      stringifyBoolean({}).should.equal('true');
      stringifyBoolean(undefined).should.equal('false');
      stringifyBoolean(() => {}).should.equal('true');
      stringifyBoolean(Symbol()).should.equal('true');

      const stringifyTuple = compileJSONStringify({
        coerceTypes: true,
        type: 'array',
        items: [
          {type: 'string'},
          {type: 'boolean'},
        ],
      });
      stringifyTuple('').should.equal('["undefined",false]');
      stringifyTuple('string').should.equal('["s",true]');
      stringifyTuple(1).should.equal('["undefined",false]');
      stringifyTuple(new Date()).should.equal('["undefined",false]');
      stringifyTuple({
        0: false,
        1: 10,
      }).should.equal('["false",true]');
      stringifyTuple(() => {}).should.equal('["undefined",false]');
      stringifyTuple(Symbol()).should.equal('["undefined",false]');

      const stringifyArray = compileJSONStringify({
        coerceTypes: true,
        type: 'array',
        items: {type: 'string'},
      });
      stringifyArray('').should.equal('[]');
      stringifyArray('string').should.equal('["s","t","r","i","n","g"]');
      stringifyArray(1).should.equal('[]');
      stringifyArray(new Date()).should.equal('[]');
      stringifyArray({
        length: 2,
        0: 0,
        1: 10,
      }).should.equal('["0","10"]');
      stringifyArray(() => {}).should.equal('[]');
      stringifyArray(x => x).should.equal('["undefined"]');
      stringifyArray(Symbol()).should.equal('[]');

      const stringifyObject = compileJSONStringify({
        coerceTypes: true,
        type: 'object',
        properties: {
          length: {type: 'number'},
        },
      });
      stringifyObject('').should.equal('{"length":0}');
      stringifyObject('string').should.equal('{"length":6}');
      stringifyObject(1).should.equal('{}');
      stringifyObject(true).should.equal('{}');
      stringifyObject(false).should.equal('{}');
      stringifyObject(new Date()).should.equal('{}');
      stringifyObject([1, 2]).should.equal('{"length":2}');
      stringifyObject(() => {}).should.equal('{"length":0}');
      stringifyObject(x => x).should.equal('{"length":1}');
      stringifyObject(Symbol()).should.equal('{}');
    });

  });

});
