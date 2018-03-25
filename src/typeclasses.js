import { Applicative, Functor, map, append } from 'funcadelic';
import { Monad, flatMap } from './monad';
import Microstate from './microstate';
import { reveal } from './utils/secret';
import Tree from './utils/tree';
import thunk from './thunk';
import { collapse } from './typeclasses/collapse';

const { keys } = Object;

function invoke({ method, args, value, tree}) {
  let nextValue = method.apply(new Microstate(tree), args);
  if (nextValue instanceof Microstate) {
    let tree = reveal(nextValue);
    return { tree, value: tree.data.value };
  } else if (nextValue === value ) {
    return { tree, value };
  } else {
    return { tree, value: nextValue };
  }
}

Functor.instance(Microstate, {
  map(fn, microstate) {
    let tree = reveal(microstate);

    // tree of transitions
    let next = map(node => {
      let transitions = node.transitionsAt(tree, invoke);
      return map(transition => {
        return (...args) => {
          let { tree } = transition(...args);
          return new Microstate(tree);
        };
      }, transitions);
    }, tree);

    let mapped = map(transitions => map(fn, transitions), next);

    return append(microstate, collapse(mapped));
  }
});

Functor.instance(Tree, {
  /**
   * Lazily invoke callback on every property of given tree,
   * the return value is assigned to property value.
   *
   * @param {*} fn (TypeTree, path) => any
   * @param {*} tree Tree
   */
  map(fn, tree) {
    return new Tree({
      data() {
        return fn(tree.data);
      },
      children() {
        return map(child => map(fn, child), tree.children);
      },
    });
  },
});

Applicative.instance(Tree, {
  pure(value) {
    return new Tree({
      data() {
        return value;
      }
    });
  }
});


Monad.instance(Tree, {
  flatMap(fn, tree) {
    let next = thunk(() => fn(tree.data));
    return new Tree({
      data() {
        return next().data;
      },
      children() {
        return map(child => flatMap(fn, child), next().children);
      },
    });
  },
});
