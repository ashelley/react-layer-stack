import { createAction, handleActions } from './helpers'

export const ACTIONS = {
  register: createAction('LAYER_STACK_VIEW_REGISTER', (id, renderFn, mountPointId) => ({ id, renderFn, mountPointId })),
  unregister: createAction('LAYER_STACK_VIEW_UNREGISTER', (id) => ({ id })),
  toggle: createAction('LAYER_STACK_VIEW_TOGGLE'),
  show: createAction('LAYER_STACK_VIEW_SHOW', (id, ...args) => ({ id, args: args })),
  setArgs: createAction('LAYER_STACK_VIEW_SET_ARGS', (id, ...args) => ({ id, args: args })),
  hide: createAction('LAYER_STACK_VIEW_HIDE'),
  hideAll: createAction('LAYER_STACK_VIEW_HIDE_ALL'),
};

export default handleActions({
  'LAYER_STACK_VIEW_REGISTER': ({views, ...state}, { payload: { id, renderFn, mountPointId } }) => {
    if (views[id]) {
      delete views[id].renderFn; // mutable to just help javascript GC
    }
    views = {...views, [id]: { renderFn, args: views[id] ? views[id].args : [], mountPointId } };
    return {...state, views};
  },
  'LAYER_STACK_VIEW_UNREGISTER': ({views, ...state}, { payload: { id } }) => {
    delete views[id]; // mutable to just help javascript GC
    return {...state, views: views};
  },
  'LAYER_STACK_VIEW_SHOW': ({displaying, views, ...state}, { payload: { id, args }}) => {
    const newView = { ...views[id] };
    let newDisplaying = displaying;
    if (0 !== args.length) {
      newView.args = args;
    }
    if (!~displaying.indexOf(id)) {
      newDisplaying = [...displaying, id]
    }
    return {...state, views: { ...views, ...{ [id]: newView } } , displaying: newDisplaying };
  },
  'LAYER_STACK_VIEW_SET_ARGS': ({views, ...state}, { payload: { id, args }}) => {
    const newView = { ...views[id] };
    if (0 !== args.length) {
      newView.args = args;
    }
    return {...state, views: { ...views, ...{ [id]: newView } } };
  },
  'LAYER_STACK_VIEW_HIDE': ({...state, displaying}, { payload: id }) => {
    if (typeof id !== 'string') {
      return {...state, displaying: [] };
    }
    const newDisplaying = [...displaying];
    const index = newDisplaying.indexOf(id);
    if (index !== -1) {
      newDisplaying.splice(index, 1);
      return {...state, displaying: newDisplaying };
    }
    return state;
  },
  'LAYER_STACK_VIEW_HIDE_ALL': ({...state}) => {
    return {...state, displaying: [] };
  },
}, {
    displaying: [],
    views: {},
});