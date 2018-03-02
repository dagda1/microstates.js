import "jest";
import { create } from '../src';
import { reveal } from '../src/utils/secret';

class Thing {
  first = class Other {
    other = String;
  }

  second = String
}

it('keeps stable states between create', () => {
  let value = {first: {other: 'Hi'}, second: 'World'};
  let a = create(Thing, value);
  let b = create(Thing, value);

  let { tree: treeA, value: valueA } = reveal(a);
  let { tree: treeB, value: valueB } = reveal(b);

  expect(treeA).toBe(treeB);
  expect(valueA).toBe(valueB);

  expect(treeA.data.valueAt(value)).toBe(treeB.data.valueAt(value));
  expect(treeA.data.stateAt(value)).toBe(treeB.data.stateAt(value));  

  expect(treeA.children.first.data).toBe(treeB.children.first.data);
  expect(treeA.children.first.data.valueAt(value)).toBe(treeB.children.first.data.valueAt(value));
  expect(treeA.children.first.data.stateAt(value)).toBe(treeB.children.first.data.stateAt(value));

  expect(a.state).toBe(b.state);
  expect(a.state.first).toBe(b.state.first);
});

// it('keeps stable states', () => {
//   let thing = create(Thing, {first: {other: 'Hi'}, second: 'World'});
//   let changed = thing.second.set('Universe');

//   expect(thing.state.first).toBe(thing.state.first);
//   expect(changed.state.first).toBe(thing.state.first);
// });

