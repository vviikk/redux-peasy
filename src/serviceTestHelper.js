/**
 * Service created by serviceBuilder
 * @callback service
 * @returns {*}
 */

/**
 * Selectively mocks certain methods and gets the rest as actual
 * @method
 * @return {Object} mocked version of http
 */
const mockFunctions = () => {
    const original = require.requireActual('./http');

    return {
        ...original, // Pass down all the exported objects
        getJson: jest.fn(),
        putJson: jest.fn(),
        patch: jest.fn(),
        post: jest.fn(),
        postFormData: jest.fn(),
        createSearchParams: jest.fn(),
    };
};

jest.mock('./http', () => mockFunctions());

const {
    patch,
    getJson,
    putJson,
    post,
} = require.requireMock('./http');

/**
 * Mocks `dispatch` and `getState` methods
 * @method
 * @param {Object} resolve promise, by default it's an empty object
 * @return {Object} mocked version of both dispatch and getState
 */
export const mockDispatchAndGetState = (state = {}) => {
    const dispatch = jest.fn();
    const getState = jest.fn().mockReturnValue(state);

    return {
        dispatch,
        getState,
    };
};

/**
 * Mocks `http.getJson` method
 * @method
 * @param {Object} mock the json method return
 * @return {undefined}
 */
export const mockGetJson = (mock, isRejected = false) => {
    getJson.mockReturnValue(
        isRejected
            ? mock
            : Promise.resolve({
                json: () => Promise.resolve(mock),
            }),
    );
};

/**
 * Mocks `http.put` method
 * @method
 * @param {Promise} the promise for the request
 * @return {undefined}
 */
export const mockPut = promise => putJson.mockReturnValue(promise);

/**
 * Mocks `http.patch` method
 * @method
 * @param {Promise} the promise for the request
 * @return {undefined}
 */
export const mockPatch = promise => patch.mockReturnValue(promise);

/**
 * Mocks `http.post` method
 * @method
 * @param {Promise} the promise for the request
 * @return {undefined}
 */
export const mockPost = promise => post.mockReturnValue(promise);

/**
 * Verify functions created with `updateAsyncActionCreator` from `serviceBuilder`
 * @method
 * @param {*} mock the http response
 * @param {service} serviceFnc is the function service
 * @param {Array} params receives an ordered array with the service function arguments
 * @param {String} expectedApi is the api endpoint
 * @param {Object} expectedParams is the data we're passing to the api
 * @param {Object} expectedReturnValue is the Object which dispatch should receive by parameter
 * @param {Function} mockFunction is the function to be used for mocked response
 * @return {void}
 * */
export const verifyUpdateAsyncService = async (
    mock,
    serviceFnc,
    params,
    expectedApi,
    expectedParams,
    expectedReturnValue,
    mockFunction = [mockPatch, patch],
    state = {},
    ok = true,
    isPost = false,
) => {
    const [mocker, mockCall] = mockFunction;
    const { dispatch, getState } = mockDispatchAndGetState(state);

    mocker(
        Promise.resolve({
            json: () => Promise.resolve(mock),
            ok,
        }),
    );

    await serviceFnc(...params)(dispatch, getState);

    expect(mockCall).toHaveBeenCalled();
    if (isPost) {
        expect(mockCall).toHaveBeenCalledWith(expectedApi, expectedParams, expect.anything(), expect.anything());
    } else {
        expect(mockCall).toHaveBeenCalledWith(expectedApi, expectedParams);
    }

    expect(dispatch).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(expectedReturnValue);
};

/**
 * Verify functions that use `http.patch`
 * @method
 * @param {service} serviceFnc is the function service
 * @param {*} mock the http response
 * @param {Object} params receives an object with the service parameters
 * @param {String} expectedApi is the api endpoint
 * @param {Object} expectedParams is the data we're passing to the api
 * @return {void}
 * */
export const verifyPatchService = async (
    serviceFnc,
    mock,
    params,
    expectedApi,
    expectedParams,
) => {
    mockPatch(
        Promise.resolve({
            json: () => Promise.resolve(mock),
        }),
    );

    await serviceFnc(...params);

    expect(patch).toHaveBeenCalled();
    expect(patch).toHaveBeenCalledWith(expectedApi, expectedParams);
};

/**
 * Verify functions created with `serviceBuilder`
 * @method
 * @param {service} serviceFnc is the function service
 * @param {Object} params receives an object with the service parameters
 * @param {*} mock the http response
 * @param {Object} expectedParams is the data we're passing to the api
 * @param {Object} expectedReturnValue is the Object which dispatch should receive by parameter
 * @param {Boolean} isError, by default it's false
 * @param {Object} state the redux state that the service might need to access
 * @return {void}
 * */
export const verifyServiceBuilder = async (serviceFnc,
    params,
    mock,
    expectedReturnValue,
    isError = false,
    state = {}) => {
    const { dispatch, getState } = mockDispatchAndGetState(state);

    mockGetJson(mock, isError);
    await serviceFnc.action(...params)(dispatch, getState);

    if (!expectedReturnValue.type.endsWith('REQUEST')) {
        expect(getJson).toHaveBeenCalled();
    }
    expect(dispatch).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(expectedReturnValue);
};

export const toBeValidService = async (service, {
    params, mock, expectedReturnValue, state,
}, _this) => {
    // check if service starts
    await verifyServiceBuilder(service, params, mock, {
        type: service.actionTypes.request,
    });

    // check if service successfully returns value
    const successPayload = {
        data: expectedReturnValue || mock,
        type: service.actionTypes.success,
    };

    await verifyServiceBuilder(service, params, mock, successPayload, false, state);

    // check if service errors out
    const error = new Error('something bad happened');
    const errorPayload = {
        type: service.actionTypes.failure,
        error,
    };
    await verifyServiceBuilder(service, params, Promise.reject(error), errorPayload, true, state);

    return { pass: !_this.isNot };
};

export const toBeValidUpdateAsyncService = async (action, {
    params,
    mock,
    expectedApi,
    expectedParams,
    expectedReturnValue,
    mockFunction = [mockPatch, patch],
    state = {},
    ok = true,
    isPost = false,
}, _this) => {
    await verifyUpdateAsyncService(
        mock,
        action,
        params,
        expectedApi,
        expectedParams,
        expectedReturnValue,
        mockFunction,
        state,
        ok,
        isPost,
    );

    return { pass: !_this.isNot };
};

export const toBeValidPatchService = async (service, {
    mock,
    params,
    expectedApi,
    expectedParams,
}, _this) => {
    await verifyPatchService(service, mock, params, expectedApi, expectedParams);

    return { pass: !_this.isNot };
};

export const toThrowAsyncActionError = (action, {
    params,
    mock,
    mockFunction = [mockPatch, patch],
    state = {},
    ok = true,
}, _this) => {
    const [mocker] = mockFunction;
    const { dispatch, getState } = mockDispatchAndGetState(state);

    mocker(
        Promise.resolve({
            json: () => Promise.resolve(mock),
            ok,
        }),
    );

    expect(action(...params)(dispatch, getState)).rejects.toThrow();

    return { pass: !_this.isNot };
};

expect.extend({
    toBeValidService(received, expected) {
        return toBeValidService(received, expected, this);
    },
    toBeValidUpdateAsyncService(received, expected) {
        return toBeValidUpdateAsyncService(received, expected, this);
    },
    toBeValidPatchService(received, expected) {
        return toBeValidPatchService(received, expected, this);
    },
    toThrowAsyncActionError(received, expected) {
        return toThrowAsyncActionError(received, expected, this);
    },
});
