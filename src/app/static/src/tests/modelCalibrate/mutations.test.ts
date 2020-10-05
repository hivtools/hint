import {expectAllMutationsDefined} from "../testHelpers";
import {ModelCalibrateMutation, mutations} from "../../app/store/modelCalibrate/mutations";
import {mockError, mockModelCalibrateState, mockModelOptionsState} from "../mocks";
import {VersionInfo} from "../../app/generated";

describe("ModelCalibrate mutations", () => {

    it("all mutation types are defined", () => {
        expectAllMutationsDefined(ModelCalibrateMutation, mutations);
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

    it("Calibrating sets calibrating to true, error to null", () => {
        const state = mockModelCalibrateState({error: mockError("TEST ERROR")});
        mutations[ModelCalibrateMutation.Calibrating](state);
        expect(state.calibrating).toBe(true);
        expect(state.error).toBeNull();
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
});
