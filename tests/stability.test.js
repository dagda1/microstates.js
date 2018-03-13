import "jest";
import { create } from '../src';
import { reveal } from '../src/utils/secret';

class Thing {
  first = class Other {
    other = String;
  }

  second = String
}

describe('stability between create', () => {
  let value = {first: {other: 'Hi'}, second: 'World'};

  let a = create(Thing, value);
  let b = create(Thing, value);
  
  let { tree: treeA, value: valueA } = reveal(a);
  let { tree: treeB, value: valueB } = reveal(b);
  
  it('does not change the between two creates with same type and value', () => {
    expect(treeA).toBe(treeB);
  });

  it('does not change the value between two create with same type and value', () => {
    expect(valueA).toBe(valueB);
  });
  
  it('has stable valueAt between trees from two creates', () => {
    expect(treeA.data.valueAt(value)).toBe(treeB.data.valueAt(value));
  });

  it('has stable stateAt between trees from two creates', () => {
    expect(treeA.data.stateAt(value)).toBe(treeB.data.stateAt(value));  
  });

  it('has stable data of composed states in trees from two creates', () => {
    expect(treeA.children.first.data).toBe(treeB.children.first.data);
    expect(treeA.children.first.data.valueAt(value)).toBe(treeB.children.first.data.valueAt(value));
    expect(treeA.children.first.data.stateAt(value)).toBe(treeB.children.first.data.stateAt(value));
  })
  
  it('has stable state root', () => {
    expect(a.state).toBe(b.state);
  });

  it('has stable composed state', () => {
    expect(a.state.first).toBe(b.state.first);
  });
});

describe('state stability of unchanged value between transitions', () => {
  let thing = create(Thing, {first: {other: 'Hi'}, second: 'World'});
  let changed = thing.second.set('Universe');
  
  it('does not change the untouched branch of initial value', () => {
    expect(thing.valueOf().first).toBe(changed.valueOf().first);
  });
  
  it('does not create a new instances for branch of value that is not changed', () => {
    expect(thing.state.first).toBe(thing.state.first);
  });
  
  it('does not change instance for branch of state where value did not change', () => {
    expect(changed.state.first).toBe(thing.state.first);
  });
});

