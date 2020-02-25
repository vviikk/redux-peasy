import { useSelector } from 'react-redux';

const get = (object, path, value) => {
    const pathArray = Array.isArray(path) ? path : path.split('.').filter(key => key);
    const pathArrayFlat = pathArray.flatMap(part => typeof part === 'string' ? part.split('.') : part);
    const checkValue = pathArrayFlat.reduce((obj, key) => obj && obj[key], object);
    return  checkValue === undefined ? value : checkValue
}

export default (where, defaultValue) => useSelector(state => get(state, where, defaultValue)) || defaultValue;