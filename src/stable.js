
/**
 * Turns any single argument function into function that caches its
 * result. The reference to the cache key is held weakly, so if the
 * argument is ever garbage collected, the result can also be garbage
 * (assuming there are no other references to it held elswhere).
 *
 * Example:
 *   const capitalizeKeys = caching(function(object) {
 *     return foldl((result, {key, value}) => append(result, {[key.capitalize()]: value}) {},object);
 *   });
 *   let value = {foo: 'bar', baz: 'bang'};
 *   capitalizeKeys(value) === capitalizeKeys(value) //=> true
 *
 * Note: Primitive values cannot be used as weakmap keys, and so
 * results will not be cached for primitive arguments.
 */
export function stable1(fn) {
  let cache = new WeakMap();
  return function(argument) {
    switch (typeof argument) {
    case "number":
    case "string":
      return fn(argument);
    default:
      let key = keyFor(argument);
      if (cache.has(key)) {
        return cache.get(key);
      } else {
        let result = fn(argument);
        cache.set(key, result);
        return result;
      }
    };
  };
}

function stable2(fn) {
  function first(a) {
    return stable1(function second(b) {
      return fn(a, b);
    });
  }
  let stableFirst = stable1(first);

  return function stablelized(a, b) {
    return stableFirst(a)(b);
  };
}

function stable3(fn) {
  function first(a) {
    return stable2(function second(b, c) {
      return fn(a, b, c);
    });
  }
  let start = stable1(first);
  return function stableized(a, b, c) {
    return start(a)(b, c);
  };
}

export default function stable(fn) {
  switch (fn.length) {
  case 0:
    return stable1(function(a) { return fn(); });
  case 1:
    return stable1(fn);
  case 2:
    return stable2(fn);
  case 3:
    return stable3(fn);
  default:
    throw new Error('Cannot make functions greater than arity 3 stable');
  }
}


const UNDEF_KEY = {};
const NULL_KEY = {};
const TRUE_KEY = {};
const FALSE_KEY = {};

function keyFor(value) {
  if (value === undefined) {
    return UNDEF_KEY;
  } else if (value === null) {
    return NULL_KEY;
  } else if (value === true) {
    return TRUE_KEY;
  } else if (value === false) {
    return FALSE_KEY;
  } else {
    return value;
  }
}
