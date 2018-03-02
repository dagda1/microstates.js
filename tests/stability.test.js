import "jest";
import { create } from 'microstates';

describe('Microstate Stability', function() {
  class Thing {
    first = class Other {
      other = String;
    }

    second = String
  }

  let thing = create(Thing, {first: {other: 'Hi'}, second: 'World'});
  let changed = thing.second.set('Universe');

  it('keeps stable states', function() {
    expect(thing.state.first).toBe(thing.state.first);
    expect(changed.state.first).toBe(thing.state.first);
  });

});
