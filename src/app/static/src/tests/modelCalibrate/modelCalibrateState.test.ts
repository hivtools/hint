import {localStorageManager} from "../../app/localStorageManager";

declare const currentUser: string; // set in jest config, or on the index page when run for real
localStorage.setItem("user", currentUser);
localStorageManager.saveState({
    modelCalibrate: {
        options: "TEST"
    },
    surveyAndProgram: {},
    baseline: {}
} as any);


import {modelCalibrate, ModelCalibrateState, modelCalibrateGetters} from "../../app/store/modelCalibrate/modelCalibrate";
import {mockModelCalibrateState, mockRootState } from "../mocks";

const rootState = mockRootState({
    modelCalibrate: mockModelCalibrateState({
        calibratePlotResult: {
            plottingMetadata: {
                barchart: {
                    indicators: ["indicator"],
                    filters: []
                }
            }
        }
    })
});

it("loads initial state from local storage", () => {
    const state = modelCalibrate.state as ModelCalibrateState;
    expect(state.options).toBe("TEST");
});

it("gets barchart indicators", async () => {
    const result = modelCalibrateGetters.indicators(mockModelCalibrateState(), null, rootState);
    expect(result.length).toEqual(1);
    expect(result).toBe(rootState.modelCalibrate.calibratePlotResult.plottingMetadata.barchart.indicators);
});

it("gets barchart filters", async () => {
    const result = modelCalibrateGetters.filters(mockModelCalibrateState(), null, rootState);
    expect(result).toStrictEqual([{
        id: "dataType", //could be snake case like the column_id, but just distinguishing here
        label: "Data Type",
        column_id: "data_type",
        options: [
            {id: "spectrum", label: "spectrum"},
            {id: "unadjusted", label: "unadjusted"},
            {id: "calibrated", label: "calibrated"}
            ]
    },
    {
        id: "spectrumRegionName",
        label: "Spectrum Region Name",
        column_id: "spectrum_region_name",
        options: [{id: "Northern", label: "Northern"}, {id: "Southern", label: "Southern"}]
    }]);
});
