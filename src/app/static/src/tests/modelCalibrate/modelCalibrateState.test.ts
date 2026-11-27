const existingState = {
    modelCalibrate: {
        options: "TEST"
    },
    surveyAndProgram: {},
    baseline: {}
} as any;


import {modelCalibrate, type ModelCalibrateState} from "../../app/store/modelCalibrate/modelCalibrate";

it("loads initial state from existingState", () => {
    const state = modelCalibrate(existingState).state as ModelCalibrateState;
    expect(state.options).toBe("TEST");
});
