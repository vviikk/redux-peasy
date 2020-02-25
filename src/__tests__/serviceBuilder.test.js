import serviceBuilder from '../serviceBuilder';

describe('service builder', () => {
    it('should throw an error when action is not a string', () => {
        expect(() => {
            serviceBuilder({}, () => {});
        }).toThrowError('actionName must be a string');
    });

    it('should throw an error when callback passed is not a function', () => {
        const param = {};

        expect(() => {
            serviceBuilder('fetchCountries', param);
        }).toThrowError(`endpoint must be a function, received: ${param}`);
    });

    describe('reducer', () => {
        const verifyReducer = (
            {
                data = null, error = null, type, expectedResult = {},
            } = {},
        ) => {
            const result = serviceBuilder('fetchCountries', () => {});
            const state = {
                data: null,
                isLoading: false,
                error: null,
            };

            const params = {
                type: `FETCH_COUNTRIES_${type}`,
                data,
                error,
            };

            expect(result.reducer(state, params)).toMatchObject({
                ...state,
                ...expectedResult,
            });
        };

        it('should return a new object, using the previous state and updating isLoading flag to true', () => {
            const type = 'BUSY';
            const data = {
                countries: ['Brazil', 'Ireland'],
            };

            const expectedResult = {
                isLoading: true,
            };

            verifyReducer({ data, type, expectedResult });
        });

        it('should return a new data with isLoading flag as false when action type is success', () => {
            const type = 'SUCCESS';
            const data = {
                countries: ['Brazil', 'Ireland'],
            };

            const expectedResult = {
                isLoading: false,
                data,
            };

            verifyReducer({ data, type, expectedResult });
        });

        it('should return the null value for the data in case the new data is undefined', () => {
            const type = 'SUCCESS';
            const data = undefined;

            verifyReducer({ data, type });
        });

        it('should return previous state with the error message', () => {
            const type = 'FAILURE';
            const error = {
                message: 'Bad busy',
            };

            const expectedResult = {
                error,
            };

            verifyReducer({ type, error, expectedResult });
        });

        it('should update data when the action type is update', () => {
            const type = 'UPDATE';
            const data = {
                data: {
                    countries: ['Brazil', 'Ireland'],
                },
            };

            const expectedResult = {
                ...data,
            };

            verifyReducer({ data, type, expectedResult });
        });

        it('should return previous state when the action type is invalid', () => {
            const type = 'COPY';
            const data = {
                data: {
                    countries: ['Brazil', 'Ireland'],
                },
            };

            verifyReducer({ data, type });
        });
    });

    describe('action', () => {
        it('should dispatch data with success', async () => {
            const mockedData = {
                country: 'Brazil',
            };

            const result = serviceBuilder('fetchCountries', () => (mockedData));
            const dispatch = jest.fn();
            const getState = jest.fn();

            await result.action()(dispatch, getState);

            expect(dispatch).toHaveBeenCalledTimes(2);

            expect(dispatch).toHaveBeenCalledWith({
                type: 'FETCH_COUNTRIES_BUSY',
            });

            expect(dispatch).toHaveBeenLastCalledWith({
                data: mockedData,
                type: 'FETCH_COUNTRIES_SUCCESS',
            });
        });

        it('should dispatch data with error message', async () => {
            const result = serviceBuilder('fetchCountries', () => {});
            const dispatch = jest.fn()
                .mockImplementationOnce()
                .mockImplementationOnce(() => throw Error('Danger!'));

            const getState = jest.fn();

            await result.action()(dispatch, getState);

            expect(dispatch).toHaveBeenCalledTimes(3);

            expect(dispatch).toHaveBeenCalledWith({
                type: 'FETCH_COUNTRIES_BUSY',
            });

            expect(dispatch).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    type: 'FETCH_COUNTRIES_FAILURE',
                }),
            );
        });
    });
});
