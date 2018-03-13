'use strict';

const rgxEscapeChars = /[\u0000-\u001f"\\]/;

function compileJSONStringify(schema) {
  const code = new CodeBuilder(schema).buildCode();
  const compile = new Function(code);

  if (schema.debug) {
    console.log(compile.toString()); // eslint-disable-line no-console
  }

  return compile();
}

class CodeBuilder {
  constructor(schema) {
    this.schema = schema;
    this.strict = schema.strict || false;

    this.schemaFnID = 0;
    this.arrayFnID = 0;
    this.objectFnID = 0;

    this.reusableSchemaFnNames = new Set();
    this.reusableArrayFnNames = new Set();
  }

  buildCode() {
    const schemaFn = this.buildSchemaFn(this.schema);
    return `'use strict';
      const rgxEscapeChars = ${rgxEscapeChars.toString()}
      ${schemaFn.code}
      return ${schemaFn.name}`;
  }

  buildSchemaFn(schema) {
    if (typeof schema !== 'object' || schema === null) {
      throw new Error(`schema must be an object. Got '${typeof schema}': ${JSON.stringify(schema)}`);
    }
    if (typeof schema.type !== 'string' && !(schema.type instanceof Array)) {
      throw new Error(`schema.type must be a string or an array. Got '${typeof schema.type}': ${JSON.stringify(schema.type)}`);
    }

    if (schema.type === 'any') {
      return {name: 'JSON.stringify', code: ''};
    }

    const types = this.sanitizeTypes(schema);
    const reusableFnName = this.buildReusableSchemaFnName(types, schema);

    if (reusableFnName !== null) {
      if (reusableFnName === 'JSON.stringify' || this.reusableSchemaFnNames.has(reusableFnName)) {
        return {name: reusableFnName, code: ''};
      }
      // Continue building the function
    }

    const name = reusableFnName || `$schema${this.schemaFnID++}`;
    var code = `\nfunction ${name}(value) {\n`;

    const {strict} = this;
    const numTypes = typeof schema.type === 'string' ? 1 : schema.type.length;
    var numTypesHandled = 0;
    var isLastType = false;

    function shouldCheckType() {
      isLastType = ++numTypesHandled === numTypes;
      return !strict || !isLastType;
    }

    if (types.handleNull) {
      if (shouldCheckType()) {
        code += 'if (value === null) ';
      }
      code += 'return "null"\n';
    }

    if (types.handleString) {
      if (shouldCheckType()) {
        code += 'if (typeof value === "string") ';
      }
      code += `return rgxEscapeChars.test(value) ? JSON.stringify(value) : '"' + value + '"'\n`;
    }

    if (types.handleNumber) {
      if (shouldCheckType()) {
        code += 'if (typeof value === "number") ';
      }
      code += 'return Number.isFinite(value) ? "" + value : "null"\n';
    }

    if (types.handleBoolean) {
      if (shouldCheckType()) {
        code += 'if (typeof value === "boolean") ';
      }
      code += 'return value ? "true" : "false"\n';
    }

    if (types.handleDate) {
      if (shouldCheckType()) {
        code += 'if (value instanceof Date) ';
      }
      code += `return '"' + value.toISOString() + '"'\n`;
    }

    if (types.arrayItems !== null) {
      const arrayFn = this.buildArrayFn(types.arrayItems);

      if (strict && numTypes === 1) {
        // Shortcut to avoid: function $schema0(value) { return $array0(value); }
        return arrayFn;
      }

      code = arrayFn.code + code;
      if (shouldCheckType()) {
        code += 'if (value instanceof Array) ';
      }
      code += `return ${arrayFn.name}(value)\n`;
    }

    if (types.objectProperties !== null) {
      if (strict && schema.additionalProperties) {
        code += 'return JSON.stringify(value)\n';
      } else if (!schema.additionalProperties) {
        const objectFn = this.buildObjectFn(types.objectProperties);

        if (strict && numTypes === 1) {
          // Shortcut to avoid: function $schema0(value) { return $object0(value); }
          return objectFn;
        }

        code = objectFn.code + code;
        if (!strict) {
          code += 'if (typeof value === "object") ';
        }
        code += `return ${objectFn.name}(value)\n`;
      }
    }

    if (!strict) {
      code += 'return JSON.stringify(value)\n';
    }

    code += '}\n';

    if (reusableFnName !== null) {
      // Mark the schema as reusable
      this.reusableSchemaFnNames.add(reusableFnName);
    }

    return {name, code};
  }

  sanitizeTypes(schema) {
    const types = typeof schema.type === 'string' ? [schema.type] : schema.type;

    if (types.length === 0) {
      throw new Error("'types' array must not be empty");
    }

    let handleNull = false;
    let handleString = false;
    let handleNumber = false;
    let handleBoolean = false;
    let handleDate = false;
    let arrayItems = null;
    let objectProperties = null;

    for (var i = 0; i < types.length; i++) {
      switch (types[i]) {
        case 'null':
          handleNull = true;
          break;
        case 'string':
          handleString = true;
          break;
        case 'number':
          handleNumber = true;
          break;
        case 'boolean':
          handleBoolean = true;
          break;
        case 'date':
          handleDate = true;
          break;
        case 'array':
          arrayItems = schema.items;
          if (typeof arrayItems !== 'object' || arrayItems === null) {
            throw new Error(
              'You must include a valid "items" schema when defining an \'array\' type. Got ' +
              `'${typeof arrayItems}': ` + JSON.stringify(arrayItems)
            );
          }
          break;
        case 'object':
          if (!this.strict) {
            handleNull = true; // Since: typeof null === 'object'
          }
          objectProperties = schema.properties;
          if (typeof objectProperties !== 'object' || objectProperties === null) {
            throw new Error(
              'You must include a "properties" object when defining an \'object\' type. Got ' +
              `'${typeof objectProperties}': ` + JSON.stringify(objectProperties)
            );
          }
          break;
        case null:
          throw new Error('Invalid type: null (Please use "null" as a string)');
        default:
          throw new Error(`Invalid type: ${JSON.stringify(types[i])}`);
      }
    }

    return {
      handleNull,
      handleString,
      handleNumber,
      handleBoolean,
      handleDate,
      arrayItems,
      objectProperties,
    };
  }

  buildReusableSchemaFnName(types, schema) {
    var name = '';

    if (types.handleNull) {
      name += '$null';
    }

    if (types.handleString) {
      name += '$string';
    }

    if (types.handleNumber) {
      name += '$number';
    }

    if (types.handleBoolean) {
      name += '$boolean';
    }

    if (types.handleDate) {
      name += '$date';
    }

    if (types.arrayItems !== null) {
      const arraySchema = types.arrayItems;
      const arrayFnName = this.buildReusableArrayFnName(arraySchema);

      if (arrayFnName === null) {
        return null;
      }

      name += `$__${arrayFnName}__`;
    }

    if (types.objectProperties !== null) {
      if (!schema.additionalProperties) {
        return null;
      }
      if (!name) {
        return 'JSON.stringify';
      }

      name += '$anyObject';
    }

    return name;
  }

  buildReusableArrayFnName(schema) {
    if (schema instanceof Array) { // Too complicated to handle this
      return null;
    }

    const types = this.sanitizeTypes(schema);
    const reusableSchemaFnName = this.buildReusableSchemaFnName(types, schema);

    return reusableSchemaFnName === null
      ? null
      : `$array_${reusableSchemaFnName}_`;
  }

  buildArrayFn(items) {
    const reusableFnName = this.buildReusableArrayFnName(items);

    if (reusableFnName !== null) {
      if (this.reusableArrayFnNames.has(reusableFnName)) {
        return {name: reusableFnName, code: ''};
      }
      // Continue building the function and mark it as reusable
      this.reusableArrayFnNames.add(reusableFnName);
    }

    const name = reusableFnName || `$array${this.arrayFnID++}`;

    return items instanceof Array
      ? this.buildTupleArrayFn(items, name)
      : this.buildUnboundedArrayFn(items, name);
  }

  buildTupleArrayFn(items, name) {
    const {length} = items;
    var code = `
      function ${name}(arr) {
        return '['`;

    for (var i = 0; i < length; i++) {
      const schemaFn = this.buildSchemaFn(items[i]);
      code = schemaFn.code + code + `
        + ${i > 0 ? '\',\' + ' : ''}${schemaFn.name}(arr[${i}])`;
    }

    code += `
        + ']'
      }
    `;

    return {name, code};
  }

  buildUnboundedArrayFn(schema, name) {
    const schemaFn = this.buildSchemaFn(schema);
    const code = schemaFn.code + `
      function ${name}(arr) {
        var str = '['
        for (var i = 0; i < arr.length; i++) {
          if (i > 0) str += ','
          str += ${schemaFn.name}(arr[i])
        }
        return str + ']'
      }
    `;

    return {name, code};
  }

  buildObjectFn(properties) {
    const {strict} = this;
    const name = `$object${this.objectFnID++}`;
    var code = `
      function ${name}(obj) {
        var str = '{'
        var addComma = false`;

    if (!strict) {
      code += `
        var val`;
    }

    for (const key in properties) {
      const accessor = buildAccessor(key);
      const stringifiedKey = stringifyPropertyKey(key);
      const schemaFn = this.buildSchemaFn(properties[key]);

      code = schemaFn.code + code;

      if (strict) {
        code += `
          if (obj${accessor} !== undefined) {
            if (addComma) {
              str += ',${stringifiedKey}:' + ${schemaFn.name}(obj${accessor})
            } else {
              addComma = true
              str += '${stringifiedKey}:' + ${schemaFn.name}(obj${accessor})
            }
          }`;
      } else {
        code += `
          if (obj${accessor} !== undefined) {
            val = ${schemaFn.name}(obj${accessor})
            if (val !== undefined) {
              if (addComma) {
                str += ',${stringifiedKey}:' + val
              } else {
                addComma = true
                str += '${stringifiedKey}:' + val
              }
            }
          }`;
      }
    }

    code += `
        return str + '}'
      }
    `;

    return {name, code};
  }
}

function buildAccessor(key) {
  return /^[^A-Za-z_$]|[^\w$]/.test(key)
    ? `[${JSON.stringify(key)}]`
    : `.${key}`;
}

function stringifyPropertyKey(key) {
  return JSON.stringify(key).replace(/\\/g, '\\\\');
}

module.exports = compileJSONStringify;
