import { append, filter, map, stable } from 'funcadelic';
import $ from './chain';

let { keys } = Object;
let id = 0;
export default class Tree {
  constructor(props = {}) {
    let { data = () => ({}), children = () => ({}) } = props;
    return Object.create(Tree.prototype, {
      data: {
        get: stable(data),
        enumerable: true,
      },
      children: {
        get: stable(children),
        enumerable: true,
      },
    });
  }
}