import React, { PropTypes, createElement} from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { ACTIONS } from './reducer'
import { isPrimitiveType } from './helpers'

export const Layer = (namespace = 'layer_stack') => connect(
  (store) => store[namespace],
  dispatch => bindActionCreators(ACTIONS, dispatch)
)((React.createClass({
  propTypes: {
    use: PropTypes.array
  },

  componentWillMount() {
    this.props.register(this.props.id, this.props.children, this.props.mountPointId);
    if (this.props.showInitially) {
      this.props.show(this.props.id, ...(this.props.initialArgs || []))
    } else {
      this.props.setArgs(this.props.id, ...(this.props.initialArgs || []))
    }
  },
  shouldComponentUpdate(newProps) {
    const { children, register, id, mountPointId, use } = this.props;
    let needUpdate = false;
    if (id !== newProps.id || mountPointId !== newProps.mountPointId) {
      needUpdate = true;
    }
    else if (children.toString() !== newProps.children.toString()) {
      needUpdate = true;
    }
    else if (use) {
      if (use.length !== newProps.use.length) {
        needUpdate = true;
      } else {
        let i = use.length;
        while (i--) {
          if (isPrimitiveType(use[i]) && isPrimitiveType(newProps.use[i])) {
            if (use[i] !== newProps.use[i]) {
              needUpdate = true
            }
          }
          else if (typeof use[i].equals === 'function' && typeof newProps.use[i].equals === 'function') {
            if (!use[i].equals(newProps.use[i])) { // fast equality check for immutable-js && mori
              needUpdate = true;
            }
          }
          else if (JSON.stringify(use[i]) !== JSON.stringify(newProps.use[i])) {
            needUpdate = true;
          }
        }
      }
    }

    if (needUpdate) {
      register(newProps.id, newProps.children, newProps.mountPointId);
      return true;
    }
    return false;
  },

  componentWillUnmount() {
    // TODO: garbage collection
    // this.props.unregister(this.props.id)
  },

  render() {
    return null;
  }
})));

export const LayerStackMountPoint = (namespace = 'layer_stack') => connect(
  (store) => store[namespace],
  dispatch => bindActionCreators(ACTIONS, dispatch)
)(({
  id: mountPointId, args: mountPointArgs, elementType = 'span', // from props
  renderFn, views, displaying, show, hide, hideAll // from store
}) => {
  return createElement(elementType, {}, renderFn ? renderFn({views, displaying, show, hide, hideAll, mountPointId, mountPointArgs}) // it's possible to provide alternative renderFn for the MountPoint
      : displaying.map ((id, index) => // if no alternative renderFn provided we'll use the default one
          createElement(elementType, { key: id }, (() => {
            const view = views[id];
            if (view && view.renderFn && view.mountPointId === mountPointId) {
              return view.renderFn({
                index, id, hideAll, displaying, views, mountPointArgs, // seems like there is no valid use-case mountPointId in the Layer render function
                showOnlyMe: (...args) => hideAll() || show(id, ...args), // TODO: think about improvement
                hide: () => hide(id), // intention here is to hide ID's management from Layer and let app developer manage these IDs independently
                // which will give an ability to write general-purpose Layers and share them b/w projects
                show: (...args) => show(id, ...args) // sometimes you may want to change args of the current layer
              }, ...view.args)
            }
            if (typeof view === 'undefined' || typeof view.renderFn === 'undefined') {
              throw new Error(`
    It seems like you're using LayerToggle with id="${ id }" but corresponding Layer isn't declared in the current Components tree.
    Make sure that Layer with id="${ id }" is rendered into the current tree.
    `
              )
            }
          })())))
});

export const LayerToggle = (namespace = 'layer_stack') => connect(
  (store) => store[namespace],
  dispatch => bindActionCreators(ACTIONS, dispatch)
)(({
  children, // from props
  displaying, show, hide, hideAll, views, ...props, // from store
}) => {
  return children({
    hideAll, displaying, views,
    isActive: displaying.indexOf(props.for) !== -1,
    show: (...args) => props.for ? show(props.for, ...args) : show(...args),
    showOnlyMe: (...args) => hideAll() || show(props.for, ...args),
    hide: (...args) => props.for ? hide(props.for, ...args) : hide(...args),
  }, ...views[props.for].args);
});