
const existingState = {
    baseline: {
        selectedDataset: {id: "123"}
    },
    surveyAndProgram: {}
} as any;

import {baseline, type BaselineState} from "../../app/store/baseline/baseline";

it("loads initial state from existingState", () => {
    const state = baseline(existingState).state as BaselineState;
    expect(state.selectedDataset).toEqual({id: "123"})
});
