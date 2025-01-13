declare const currentUser: string; // set in jest config, or on the index page when run for real
localStorage.setItem("user", currentUser);

const existingState = {
    baseline: {
        selectedDataset: {id: "123"}
    },
    surveyAndProgram: {}
} as any;

import {baseline, BaselineState} from "../../src/store/baseline/baseline";

it("loads initial state from existingState", () => {
    const state = baseline(existingState).state as BaselineState;
    expect(state.selectedDataset).toEqual({id: "123"})
});
