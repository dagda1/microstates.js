import 'jest';

import stable from '../src/stable';

describe('function stability', function() {

  function unstable1(a) {
    return {...a};
  }

  let stableized1 = stable(unstable1);

  it('returns the same values for an argument of 1 argument', function() {
    let a = {'hello': 'world'};
    expect(unstable1(a)).not.toBe(unstable1(a));
    expect(stableized1(a)).toBe(stableized1(a));
  });

  function unstable2(a, b) {
    return {...a, ...b};
  }

  let stableized2 = stable(unstable2);

  it('returns the same value for a function with 2 arguments', function () {
    let a = {hello: 'world'};
    let b = {how: 'are you?'};

    expect(stableized2(a, b)).toBe(stableized2(a, b));
  });

  let stableized0 = stable(function unstable0() {
    return {};
  });

  it('returns the same value for a function with 0 arguments', function() {
    expect(stableized0()).toBe(stableized0());
  });

  let stableized3 = stable(function(a, b, c) {
    return {...a, ...b, ...c};
  });

  it('returns the same value for a function with 3 arguments', function() {
    let a = {}; let b = {}; let c = {};
    expect(stableized3(a, b, c)).toBe(stableized3(a, b, c));
  });

  it('returns the same value for boolean arguments', function() {
    expect(stableized3(true, false, true)).toBe(stableized3(true, false, true));
  });

  it('returns the same value for undefined and null as arguments', function() {
    expect(stableized3(null, undefined, null)).toBe(stableized3(null, undefined, null));
  });

});
