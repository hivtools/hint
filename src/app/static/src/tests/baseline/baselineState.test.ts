import {localStorageManager} from "../../app/localStorageManager";
declare const currentUser: string; // set in jest config, or on the index page when run for real
localStorage.setItem("user", currentUser);
localStorageManager.saveState({
    baseline: {
        selectedDataset: {id: "123"}
    },
    surveyAndProgram: {}
} as any);

import {baseline, BaselineState} from "../../app/store/baseline/baseline";

it("loads initial state from local storage", () => {
    const state = baseline.state as BaselineState;
    expect(state.selectedDataset).toEqual({id: "123"})
});
