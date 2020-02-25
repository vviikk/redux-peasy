import { useMemo } from 'react';
import { bindActionCreators } from 'redux';
import { useDispatch } from 'react-redux';

export default (service) => {
    const dispatch = useDispatch();
    if (service.action) {
        return [
            // action
            useMemo(() => bindActionCreators(service.action, dispatch), [service.action, dispatch]),
            // clear action
            useMemo(() => bindActionCreators(service.cleanAction, dispatch), [service.cleanAction, dispatch]),
        ];
    }

    if (service instanceof Object) {
        return Object.entries(service).reduce((acc, [key, aService]) => ({
            ...acc,
            [key]: useMemo(() => bindActionCreators(aService.action, dispatch), [aService.action]),
        }), {});
    }

    throw new Error('Invalid useBindActionCreators argument given');
};
