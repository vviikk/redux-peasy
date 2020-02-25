/** This is a magical utility function that helps with http requests.
 * It returns the action, three actionTypes for request, success, failure,
 * and a reducer. It also automagically sets request and failure depending if
 * the fn executed properly
 * @function serviceBuilder
 * @param {string} actionName the name of the action in camelCase
 * @param {function} fn function to fire to make the request - this can be any function
 * @param {function} updateFn function to fire to make the update on whatever parameters are provided
 * @returns {object} { action, { data, loading, error }, reducer }
 * */
export default (serviceName, fn) => {
    if (typeof serviceName !== 'string') {
        throw Error('actionName must be a string');
    }

    if (typeof fn !== 'function') {
        throw Error(`endpoint must be a function, received: ${fn}`);
    }

    const actionSuffixes = ['busy', 'success', 'failure', 'update'];

    const SERVICE_NAME = serviceName.split(/(?=[A-Z])/).join('_').toUpperCase();
    // All that's happening here is we get an object like
    // { request: 'ACTION_NAME_REQUEST', success: 'ACTION_NAME_SUCCESS', failure: 'ACTION_NAME_FAILURE' }
    const actionTypes = actionSuffixes.reduce((acc, suffix) => ({
        ...acc,
        [suffix]: [SERVICE_NAME, suffix.toUpperCase()].join('_'),
    }), {});

    const initialState = {
        data: null,
        isLoading: false,
        error: null,
    };

    const reducer = (state = initialState, { type, data, error }) => {
        switch (type) {
            case actionTypes.busy:
                return {
                    ...state,
                    isLoading: true,
                };

            case actionTypes.success:
                return {
                    ...state,
                    isLoading: false,
                    data: data || null, // checks undefined and null, returns null in both cases
                };

            case actionTypes.failure:
                return {
                    ...state,
                    isLoading: false,
                    error,
                };

            case actionTypes.update:
            default:
                return {
                    ...state,
                    ...data,
                    isLoading: false,
                };
        }
    };

    /**
     * Returns a redux action
     * Use it when you need to update the state of the reducer inside your service
     *
     * @callback callback A callback function invoked during action being dispatched
     */
    const getNewActionSync = (callback, actionNameSuffix) => {
        const newActionName = actionNameSuffix ? SERVICE_NAME + '_' + actionNameSuffix : actionTypes.update
        const actionCreator = (...args) => (dispatch, getState) => {
            dispatch({
                type: newActionName,
                data: callback(getState(), ...args),
            });
        };

        actionCreator.actionType = newActionName;

        return actionCreator;
    };

    /**
     * Returns am async redux action
     * Use it when you need to update the state of the reducer inside your service
     * by by calling backend requests
     *
     * @callback callback A callback function invoked during action being dispatched
     */
    const getNewAction = (callback, actionNameSuffix) => {
        const newActionName = actionNameSuffix ? SERVICE_NAME + '_' + actionNameSuffix : actionTypes.update
        const asyncActionCreator = (...args) => async (dispatch, getState) => {
            dispatch({
                type: actionTypes.busy,
            });
            try {
                const data = await Promise.resolve(callback(getState(), ...args));
                dispatch({
                    type: newActionName,
                    data,
                });

                return Promise.resolve(data);
            } catch (error) {
                dispatch({
                    type: actionTypes.failure,
                    error,
                });

                return Promise.reject(error);
            }
        };
        asyncActionCreator.actionType = newActionName;

        return asyncActionCreator;
    };


    return {
        action: getNewAction(fn, 'SUCCESS'),
        getNewActionSync,
        getNewAction,
        actionTypes,
        reducer,
        cleanAction: getNewAction(() => ({ data: null, error: null }), 'CLEAN'),
    };
};
