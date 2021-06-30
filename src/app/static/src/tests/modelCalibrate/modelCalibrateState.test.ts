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
                    indicators: ["testIndicators"],
                    filters: ["testFilters"]
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
    expect(result).toStrictEqual(["testIndicators"]);
});

it("gets barchart filters", async () => {
    const result = modelCalibrateGetters.filters(mockModelCalibrateState(), null, rootState);
    expect(result).toStrictEqual(["testFilters"]);
});
