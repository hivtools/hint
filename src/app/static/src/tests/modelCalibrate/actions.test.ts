import {
    mockAxios,
    mockError,
    mockFailure,
    mockModelCalibrateState,
    mockModelRunState,
    mockRootState,
    mockSuccess
} from "../mocks";
import {actions} from "../../app/store/modelCalibrate/actions";
import {ModelCalibrateMutation} from "../../app/store/modelCalibrate/mutations";
import {freezer} from "../../app/utils";

const rootState = mockRootState();
describe("ModelCalibrate actions", () => {
    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
    });

    it("fetchModelCalibrateOptions fetches options and commits mutations", async () => {
        const commit = jest.fn();
        const state = mockModelCalibrateState();
        mockAxios.onGet("/model/calibrate/options/").reply(200, mockSuccess("TEST", "v1"));

        await actions.fetchModelCalibrateOptions({commit, state, rootState} as any);

        expect(commit.mock.calls.length).toBe(3);
        expect(commit.mock.calls[0][0]).toBe(ModelCalibrateMutation.FetchingModelCalibrateOptions);
        expect(commit.mock.calls[1][0].type).toBe(ModelCalibrateMutation.ModelCalibrateOptionsFetched);
        expect(commit.mock.calls[1][0].payload).toBe("TEST");
        expect(commit.mock.calls[2][0].type).toBe(ModelCalibrateMutation.SetModelCalibrateOptionsVersion);
        expect(commit.mock.calls[2][0].payload).toBe("v1")
    });

    it("submit action calls submit endpoint, commits mutations and starts polling", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const mockVersion = {naomi: "1.0.0", hintr: "1.0.0", rrq: "1.0.0"};
        const state = mockModelCalibrateState({version: mockVersion});
        const root = mockRootState({
            modelRun: mockModelRunState({modelRunId: "123A"})
        });
        const mockOptions = {"param_1": "value 1"};
        const url = `model/calibrate/submit/123A`;
        mockAxios.onPost(url).reply(200, mockSuccess("TEST"));
        const freezeSpy = jest.spyOn(freezer, "deepFreeze");
        await actions.submit({commit, dispatch, state, rootState: root} as any, mockOptions);

        expect(mockAxios.history.post.length).toBe(1);
        expect(mockAxios.history.post[0].url).toBe(url);
        expect(JSON.parse(mockAxios.history.post[0].data)).toStrictEqual({version: mockVersion, options: mockOptions});

        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]).toBe(ModelCalibrateMutation.SetOptionsData);
        expect(commit.mock.calls[0][1]).toBe(mockOptions);
        expect(commit.mock.calls[1][0].type).toBe(ModelCalibrateMutation.CalibrateStarted);

        expect(dispatch.mock.calls.length).toBe(1);
        expect(dispatch.mock.calls[0][0]).toBe("poll");
    });

    it("submit action commits error on unsuccessful request", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const mockVersion = {naomi: "1.0.0", hintr: "1.0.0", rrq: "1.0.0"};
        const state = mockModelCalibrateState({version: mockVersion});
        const root = mockRootState({
            modelRun: mockModelRunState({modelRunId: "123A"})
        });

        const testError =  mockError("TEST ERROR");
        mockAxios.onPost(`/model/calibrate/submit/123A`).reply(400, mockFailure("TEST ERROR"));
        await actions.submit({commit, dispatch, state, rootState: root} as any, {});

        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]).toBe(ModelCalibrateMutation.SetOptionsData);
        expect(commit.mock.calls[1][0].type).toBe(ModelCalibrateMutation.SetError);
        expect(commit.mock.calls[1][0].payload).toStrictEqual(testError);
        expect(dispatch.mock.calls.length).toBe(0);
    });

    it("poll commits status when successfully fetched", async (done) => {
        mockAxios.onGet(`/model/calibrate/status/1234`)
            .reply(200, mockSuccess("TEST DATA"));

        const commit = jest.fn();
        const dispatch = jest.fn();
        const state = mockModelCalibrateState({calibrateId: "1234"});

        actions.poll({commit, dispatch, state, rootState} as any);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0].type).toBe("PollingForStatusStarted");
            expect(commit.mock.calls[0][0].payload).toBeGreaterThan(-1);
            expect(commit.mock.calls[1][0].type).toBe("CalibrateStatusUpdated");
            expect(commit.mock.calls[1][0].payload).toBe("TEST DATA");
            expect(dispatch.mock.calls.length).toBe(0);

            done();
        }, 2100);
    });

    it("poll commits error when unsuccessful fetch", (done) => {
        mockAxios.onGet(`/model/calibrate/status/1234`)
            .reply(500, mockFailure("Test Error"));

        const commit = jest.fn();
        const dispatch = jest.fn();
        const state = mockModelCalibrateState({calibrateId: "1234"});

        actions.poll({commit, dispatch, state, rootState} as any);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0].type).toBe("PollingForStatusStarted");

            expect(commit.mock.calls[1][0]).toStrictEqual({
                type: "SetError",
                payload: mockError("Test Error")
            });
            expect(dispatch.mock.calls.length).toBe(0);

            done();
        }, 2100);
    });

    it("poll dispatches getResult when status done", async (done) => {
        mockAxios.onGet(`/model/calibrate/status/1234`)
            .reply(200, mockSuccess("TEST DATA"));

        const commit = jest.fn();
        const dispatch = jest.fn();
        const state = mockModelCalibrateState({calibrateId: "1234", status: {done: true, success: false} as any});

        actions.poll({commit, dispatch, state, rootState} as any);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2);
            expect(commit.mock.calls[0][0].type).toBe("PollingForStatusStarted");
            expect(commit.mock.calls[1][0].type).toBe("CalibrateStatusUpdated");

            expect(dispatch.mock.calls.length).toBe(1);
            expect(dispatch.mock.calls[0][0]).toBe("getResult");

            done();
        }, 2100);
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
            },
            uploadMetadata: {
                outputZip: {description: "spectrum output info"},
                outputSummary: {description: "summary output info"}
            }
        };
        mockAxios.onGet(`/model/calibrate/result/1234`)
            .reply(200, mockSuccess(testResult));

        const commit = jest.fn();
        const state = mockModelCalibrateState({
            calibrateId: "1234",
            status: {
                success: true,
                done: true
            } as any
        });

        await actions.getResult({commit, state, rootState} as any);

        expect(commit.mock.calls.length).toBe(5);
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type:"modelRun/RunResultFetched",
            payload: testResult
        });
        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "plottingSelections/updateBarchartSelections",
            payload: {
                indicatorId: "test indicator",
                xAxisId: "test_x",
                disaggregateById: "test_dis",
                selectedFilterOptions: {"test_name": "test_value"}
            }
        });
        expect(commit.mock.calls[2][0]).toBe("Calibrated");
        expect(commit.mock.calls[3][0]).toStrictEqual({
            type: "UploadMetadata",
            payload: {
                "outputSummary": {"description": "summary output info"},
                "outputZip": {"description": "spectrum output info"}
            }
        });
        expect(commit.mock.calls[4][0]).toBe("Ready");
    });

    it("getResult commits error when unsuccessful fetch", async () => {
        mockAxios.onGet(`/model/calibrate/result/1234`)
            .reply(500, mockFailure("Test Error"));

        const commit = jest.fn();
        const state = mockModelCalibrateState({
            calibrateId: "1234",
            status: {
                success: true,
                done: true
            } as any
        });

        await actions.getResult({commit, state, rootState} as any);

        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: "SetError",
            payload: mockError("Test Error")
        });
        expect(commit.mock.calls[1][0]).toBe("Ready");
    });

    it("getResult does not fetch when status is not done", async () => {
        mockAxios.onGet(`/model/calibrate/result/1234`)
            .reply(200, mockSuccess("Test result"));

        const commit = jest.fn();
        const state = mockModelCalibrateState({
            calibrateId: "1234",
            status: {
                success: false,
                done: false
            } as any
        });

        await actions.getResult({commit, state, rootState} as any);

        expect(mockAxios.history.get.length).toBe(0);

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]).toBe("Ready");
    });
});
