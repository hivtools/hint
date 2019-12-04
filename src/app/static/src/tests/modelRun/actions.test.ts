import {
    mockAxios,
    mockError,
    mockFailure,
    mockModelOptionsState,
    mockModelRunState,
    mockRootState,
    mockSuccess
} from "../mocks";
import {actions} from "../../app/store/modelRun/actions";
import {ModelResultResponse, ModelStatusResponse} from "../../app/generated";
import {expectEqualsFrozen} from "../actionTestHelpers";

describe("Model run actions", () => {

    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
    });

    it("passes model options and version from state", async () => {

        mockAxios.onPost(`/model/run/`)
            .reply(200, mockSuccess({id: "12345"}));

        const commit = jest.fn();
        const rootState = mockRootState({
            modelOptions: mockModelOptionsState({
                options: {1: "TEST"},
                version: "v1" as any
            })
        });
        await actions.run({commit, rootState} as any);
        expect(JSON.parse(mockAxios.history.post[0].data))
            .toStrictEqual({options: {1: "TEST"}, version: "v1"})
    });

    it("commits run id after triggering a model run", async () => {

        mockAxios.onPost(`/model/run/`)
            .reply(200, mockSuccess({id: "12345"}));

        const commit = jest.fn();
        await actions.run({commit, rootState: mockRootState()} as any);
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "ModelRunStarted",
            payload: {id: "12345"}
        });

    });

    it("fetches model run result after polling when status is done", (done) => {

        mockAxios.onGet(`/model/status/1234`)
            .reply(200, mockSuccess({}));
        mockAxios.onGet(`/model/result/1234`)
            .reply(200, mockSuccess({}));

        const state = mockModelRunState({status: {done: true} as ModelStatusResponse});
        const commit = jest.fn();
        const dispatch = jest.fn();

        actions.poll({commit, state, dispatch} as any, "1234");

        setInterval(() => {
            expect(dispatch.mock.calls[0][0]).toStrictEqual("getResult");
            expect(dispatch.mock.calls[0][1]).toStrictEqual("1234");
            done();
        }, 2100);
    });

    it("does not fetch model run result after polling if done is not true", (done) => {

        mockAxios.onGet(`/model/status/1234`)
            .reply(200, mockSuccess({}));
        mockAxios.onGet(`/model/result/1234`)
            .reply(200, mockSuccess({}));

        const state = mockModelRunState({status: {done: false} as ModelStatusResponse});
        const commit = jest.fn();
        const dispatch = jest.fn();

        actions.poll({commit, state, dispatch} as any, "1234");

        setInterval(() => {
            expect(dispatch.mock.calls.length).toEqual(0);
            done();
        }, 2100);

    });

    it("poll commits status when successfully fetched", async (done) => {
        mockAxios.onGet(`/model/status/1234`)
            .reply(200, mockSuccess("TEST DATA"));
        mockAxios.onGet(`/model/result/1234`)
            .reply(200, mockSuccess({}));

        const commit = jest.fn();
        const state = mockModelRunState();

        actions.poll({commit, state} as any, "1234");

        setTimeout(() => {
            expect(commit.mock.calls[0][0].type).toBe("PollingForStatusStarted");

            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: "RunStatusUpdated",
                payload: "TEST DATA"
            });

            done();
        }, 2100);
    });

    it("poll commits error when unsuccessful fetch", (done) => {
        mockAxios.onGet(`/model/status/1234`)
            .reply(500, mockFailure("Test Error"));

        const commit = jest.fn();
        const state = mockModelRunState();

        actions.poll({commit, state} as any, "1234");

        setTimeout(() => {
            expect(commit.mock.calls[0][0].type).toBe("PollingForStatusStarted");

            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: "RunStatusError",
                payload: mockError("Test Error")
            });

            done();
        }, 2100);
    });

    it("getResult commits result when successfully fetched", async () => {
        mockAxios.onGet(`/model/result/1234`)
            .reply(200, mockSuccess("TEST DATA"));

        const commit = jest.fn();
        const state = mockModelRunState({modelRunId: "1234", status: {done: true} as ModelStatusResponse});

        await actions.getResult({commit, state} as any);

        expectEqualsFrozen(commit.mock.calls[0][0], {
            type: "RunResultFetched",
            payload: "TEST DATA"
        });
        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "Ready",
            payload: true
        });
    });

    it("getResult commits result when successfully fetched, and sets default plotting selections", async () => {
        const testResult = {
            data: "TEST DATA",
            plottingMetadata: {
                barchart: {
                    defaults: {
                        indicator_id: "test indicator",
                        x_axis_id: "test_x",
                        disaggregate_by_id: "test_dis",
                        selected_filter_options: {"test_name": "test_value"}
                    }
                }
            }
        };
        mockAxios.onGet(`/model/result/1234`)
            .reply(200, mockSuccess(testResult));

        const commit = jest.fn();
        const state = mockModelRunState({
            modelRunId: "1234",
            status: {done: true} as ModelStatusResponse,
            result: testResult as any
        });

        await actions.getResult({commit, state} as any);

        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "plottingSelections/updateBarchartSelections",
            payload: {
                indicatorId: "test indicator",
                xAxisId: "test_x",
                disaggregateById: "test_dis",
                selectedFilterOptions: {"test_name": "test_value"}
            }
        });
    });

    it("getResult commits error when unsuccessful fetch", async () => {
        mockAxios.onGet(`/model/result/1234`)
            .reply(500, mockFailure("Test Error"));

        const commit = jest.fn();
        const state = mockModelRunState({modelRunId: "1234", status: {done: true, id: "1234"} as ModelStatusResponse});

        await actions.getResult({commit, state} as any);

        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "RunResultError",
            payload: mockError("Test Error")
        });
        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "Ready",
            payload: true
        });
    });

    it("getResult does not get result if done is not true", async () => {
        mockAxios.onGet(`/model/result/1234`)
            .reply(200, mockSuccess("TEST DATA"));

        const commit = jest.fn();
        const state = mockModelRunState({modelRunId: "1234", status: {done: false, id: "1234"} as ModelStatusResponse});

        await actions.getResult({commit, state} as any);

        expect(mockAxios.history.get.length).toBe(0);
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "Ready",
            payload: true
        });
    });
});
