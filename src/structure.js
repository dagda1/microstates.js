import $ from './utils/chain';
import { type, map, append, pure } from 'funcadelic';
import { flatMap } from './monad';
import { view, set, lensTree, lensPath } from './lens';
import Tree from './utils/tree';
import transitionsFor from './utils/transitions-for';
import { reveal } from './utils/secret';
import types, { params, any, toType } from './types';
import isSimple  from './is-simple';
import desugar from './desugar';
import Microstate from './microstate';
import { collapse } from './typeclasses/collapse';
import stable from './stable';

const { assign } = Object;

export default stable(function analyze(Type, value) {
  return flatMap(stableAnalyzeType(value), pure(Tree, new Node(Type, [])));
})

export const stableCollapseState = stable(function (tree, value) {
  return collapse(stableTruncatedMapper(stableStateMapper(value), stableTruncate(tree)));
});

let stableTruncatedMapper = stable(function truncateMapper(callback, truncated) {
  return map(callback, truncated);
});

let stableTruncate = stable(function truncateSimple(tree) {
  return truncate(node => node.isSimple, tree);
});

let stableStateMapper = stable(function stateMapper(value) {
  return stable(node => node.stateAt(value));
});

let stableAnalyzeType = stable(function analyzeType(value) {    
  return stable((node) => {
    let InitialType = desugar(node.Type);
    let valueAt = node.valueAt(value);
    let Type = toType(InitialType);

    let instance = Type.hasOwnProperty('create') ? Type.create(valueAt) : undefined;

    if (instance instanceof Microstate) {
      let { tree , value } = reveal(instance);

      let shift = new ShiftNode(tree.data, value);
      return graft(node.path, new Tree({
        data: () => shift,
        children: () => tree.children
      }));
    }

    return new Tree({
      data: () => Type === node.Type ? node : append(node, { Type }),
      children() {
        let childTypes = childrenAt(Type, node.valueAt(value));
        return map((ChildType, path) => pure(Tree, new Node(ChildType, append(node.path, path))), childTypes);
      }
    });
  });
})

const Location = type(class Location {
  stateAt(Type, instance, value) {
    return this(Type.prototype).stateAt(instance, value);
  }
  childrenAt(Type, value) {
    return this(Type.prototype).childrenAt(Type, value);
  }
});

const { stateAt, childrenAt } = Location.prototype;

Location.instance(Object, {
  stateAt(instance, value) {
    if (value) {
      return append(instance, value);
    } else {
      return instance;
    }
  },

  childrenAt(Type, value) {
    return $(new Type())
      .map(desugar)
      .filter(({ value }) => !!value && value.call)
      .valueOf();
  }
});

Location.instance(types.Object, {
  stateAt: _ => {},
  childrenAt(Type, value) {
    let { T } = params(Type);
    if (T !== any) {
      return map(_ => T, value);
    } else {
      return Location.for(Object).childrenAt(Type, value);
    }
  }
});

Location.instance(types.Array, {
  stateAt: _ => [],
  childrenAt(...args) {
    return Location.for(types.Object.prototype).childrenAt(...args);
  }
});

function truncate(fn, tree) {
  return flatMap(node => {
    let subtree = view(lensTree(node.path), tree);
    if (fn(subtree.data)) {
      return append(subtree, { children: [] });
    } else {
      return subtree;
    }
  }, tree);
}

/**
 * Turn any structure tree into a root tree.
 *
 * Every node in a tree knows its path. This path is what identifies
 * its context in the containing tree.
 *
 * This lets you take any tree, sitting at any context and make it
 * "context free". I.e. converts it into a root.
 *
 * @param {Tree} tree - the tree to isolate
 * @returns {Tree} - a tree just like `tree`, but now a root.
 */
function prune(tree) {
  let prefix = tree.data.path;
  return map(node => append(node, { path: node.path.slice(prefix.length)}), tree);
}

/**
 * Change the path of a tree.
 *
 * This lets you take any tree, sitting at any context and prefix the context with
 * additional path.
 *
 * @param {*} tree
 * @param {*} path
 */
function graft(path, tree) {
  if (path.length === 0) {
    return tree;
  } else {
    return map(node => append(node, { path: [...path, ...node.path]}), tree);
  }
}

const stableStateAt = stable(function(node, value) {
  let { Type } = node;
  let valueAt = node.valueAt(value);
  let instance = new Type(valueAt).valueOf();
  if (isSimple(Type)) {
    return valueAt || instance;
  } else {
    return stateAt(Type, instance, valueAt);
  }
});

const stableValueAt = stable(function(path, total) {
  return view(lensPath(path), total)
});

export class Node {
  constructor(Type, path) {
    assign(this, { Type, path });
  }

  get isSimple() {
    return isSimple(this.Type);
  }

  valueAt(total) {
    return stableValueAt(this.path, total);
  }

  stateAt(value) {
    return stableStateAt(this, value);
  }

  transitionsAt(value, tree, invoke) {
    let { Type, path } = this;

    return map(method => (...args) => {
      let localValue = this.valueAt(value);
      let localTree = view(lensTree(path), tree);

      let transition = {
        method,
        args,
        value: localValue,
        tree: prune(localTree)
      };

      let {
        value: nextLocalValue,
        tree: nextLocalTree
      } = invoke(transition);

      let nextTree = set(lensTree(path), graft(path, nextLocalTree), tree);
      let nextValue = set(lensPath(path), nextLocalValue, value);

      return { tree: nextTree, value: nextValue };
    }, transitionsFor(Type));
  }
}

class ShiftNode extends Node {
  constructor({ Type, path }, value) {
    super(Type, path);
    assign(this, { value });
  }

  valueAt() {
    return this.value;
  }
}
