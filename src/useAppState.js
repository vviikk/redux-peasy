import { useSelector } from 'react-redux';
import get from './get';

/**
 * A hook to access the redux store's state. This hook takes a string `path`
 * as an argument. The selector returns the value found in the state.
 *
 * An optional defaultValue is taken as the second argument and is returned if
 * the path isn't found. This hook is inspired by lodash's `get` function.
 *
 * @param {string} path works like lodash get and returns the value if found in state object
 * @param {*} defaultValue returned if the state object doesn't have the value being searched for
 *
 * @returns {any} the selected state
 *
 * @example
 *
 * import React from 'react'
 * import { useAppState } from 'redux-peasy'
 *
 * export const CounterComponent = () => {
 *   const counter = useAppState('counter');
 *   return <div>{counter}</div>
 * }
 */
export default (path, defaultValue = null) => useSelector(state => get(state, path, defaultValue)) || defaultValue;