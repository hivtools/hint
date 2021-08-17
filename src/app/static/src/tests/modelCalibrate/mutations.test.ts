import {expectAllMutationsDefined} from "../testHelpers";
import {ModelCalibrateMutation, mutations} from "../../app/store/modelCalibrate/mutations";
import {mockError, mockModelCalibrateState,} from "../mocks";
import {VersionInfo} from "../../app/generated";

describe("ModelCalibrate mutations", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("all mutation types are defined", () => {
        expectAllMutationsDefined(ModelCalibrateMutation, mutations);
    });

    it("sets Ready", () => {
        const state = mockModelCalibrateState();
        expect(state.ready).toBe(false);
        mutations[ModelCalibrateMutation.Ready](state);
        expect(state.ready).toBe(true);
    });

    it("FetchingModelCalibrateOptions sets fetching to true", () => {
        const state = mockModelCalibrateState();
        mutations[ModelCalibrateMutation.FetchingModelCalibrateOptions](state);
        expect(state.fetching).toBe(true);
    });

    it("ModelCalibrateOptionsFetched sets expected state values", () => {
        const state = mockModelCalibrateState({fetching: true, optionsFormMeta: {controlSections: []}});
        const payload = {controlSections: [{label: "TEST SECTION", controlGroups: []}]};
        mutations[ModelCalibrateMutation.ModelCalibrateOptionsFetched](state, {payload});
        expect(state.fetching).toBe(false);
        expect(state.optionsFormMeta).toStrictEqual(payload);
    });

    it("Update sets expected state values", () => {
        const state = mockModelCalibrateState({complete: true, optionsFormMeta: {controlSections: []}});
        const payload = {controlSections: [{label: "TEST SECTION", controlGroups: []}]};
        mutations[ModelCalibrateMutation.Update](state, payload);
        expect(state.complete).toBe(false);
        expect(state.optionsFormMeta).toBe(payload);
    });

    it("CalibrateStarted sets calibrateId, calibrating to true, error to null", () => {
        const state = mockModelCalibrateState({
            error: mockError("TEST ERROR"),
            complete: true,
            status: ["TEST STATUS"] as any
        });
        const payload = {id: "123"} as any;
        mutations[ModelCalibrateMutation.CalibrateStarted](state, {payload});
        expect(state.calibrateId).toBe("123");
        expect(state.calibrating).toBe(true);
        expect(state.error).toBeNull();
        expect(state.complete).toBe(false);
        expect(state.status).toStrictEqual({});
        expect(state.generatingCalibrationPlot).toBe(false);
        expect(state.calibratePlotResult).toBe(null);
    });

    it("CalibrateStatusUpdate sets status, resets error", () => {
        const state = mockModelCalibrateState({error: mockError("TEST ERROR")});
        const payload = ["TEST PAYLOAD"] as any;
        mutations[ModelCalibrateMutation.CalibrateStatusUpdated](state, {payload});
        expect(state.status).toStrictEqual(payload);
        expect(state.error).toBeNull();
    });

    it("CalibrateStatusUpdate stops polling if status is done", () => {
        const state = mockModelCalibrateState({statusPollId: 99});
        const payload = {done: true} as any;
        const spy = jest.spyOn(window, "clearInterval");

        mutations[ModelCalibrateMutation.CalibrateStatusUpdated](state, {payload});
        expect(state.statusPollId).toBe(-1);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(99);
    });

    it("Calibrated sets complete to true", () => {
        const state = mockModelCalibrateState({calibrating: true});
        mutations[ModelCalibrateMutation.Calibrated](state);
        expect(state.complete).toBe(true);
        expect(state.calibrating).toBe(false);
    });

    it("sets version", () => {
        const state = mockModelCalibrateState();
        const mockVersion: VersionInfo = {
            hintr: "1",
            naomi: "2",
            rrq: "3"
        };
        mutations[ModelCalibrateMutation.SetModelCalibrateOptionsVersion](state, {payload: mockVersion});
        expect(state.version).toStrictEqual(mockVersion);
    });

    it("sets error", () => {
        const state = mockModelCalibrateState();
        const error = mockError("TEST ERROR");
        mutations[ModelCalibrateMutation.SetError](state, {payload: error});
        expect(state.error).toBe(error);
        expect(state.calibrating).toBe(false);
    });

    it("SetError stops polling", () => {
        const state = mockModelCalibrateState({statusPollId: 99});
        const error = mockError("TEST ERROR");
        const spy = jest.spyOn(window, "clearInterval");

        mutations[ModelCalibrateMutation.SetError](state, {payload: error});
        expect(state.statusPollId).toBe(-1);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(99);
    });

    it("sets error stops calibration plot being generated", () => {
        const state = mockModelCalibrateState({ generatingCalibrationPlot: true });
        const error = mockError("TEST ERROR");
        mutations[ModelCalibrateMutation.SetError](state, {payload: error});
        expect(state.generatingCalibrationPlot).toBe(false);
    });

    it("sets options", () => {
        const state = mockModelCalibrateState();
        const options = { "testOption": "testValue" };
        mutations[ModelCalibrateMutation.SetOptionsData](state, {payload: options});
        expect(state.options).toBe(options);
    });

    it("PollingForStatusStarted sets statusPollId", () => {
        const state = mockModelCalibrateState();
        mutations[ModelCalibrateMutation.PollingForStatusStarted](state, {payload: 99});
        expect(state.statusPollId).toBe(99);
    });

    it("sets calibration plot started and resets error and previous plot", () => {
        const state = mockModelCalibrateState({error: mockError("TEST ERROR"), calibratePlotResult: {}});
        mutations[ModelCalibrateMutation.CalibrationPlotStarted](state);
        expect(state.generatingCalibrationPlot).toBe(true);
        expect(state.calibratePlotResult).toBe(null);
        expect(state.error).toBe(null);
    });

    it("sets calibration plot data", () => {
        const state = mockModelCalibrateState({generatingCalibrationPlot: true});
        const payload = { data: "TEST DATA" };
        mutations[ModelCalibrateMutation.SetPlotData](state, {payload});
        expect(state.calibratePlotResult).toStrictEqual({ payload });
        expect(state.generatingCalibrationPlot).toBe(false);
    });
});
