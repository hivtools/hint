declare const currentUser: string; // set in jest config, or on the index page when run for real
localStorage.setItem("user", currentUser);
const existingState = {
    modelRun: {
        modelRunId: "1234",
        status: {success: true},
        errors: [],
        statusPollId: -1,
        ready: true
    },
    surveyAndProgram: {},
    baseline: {}
} as any;

import {modelRun, ModelRunState} from "../../src/store/modelRun/modelRun";

it("loads initial state from existingState, but resets ready to false", () => {
    const state = modelRun(existingState).state as ModelRunState;
    expect(state.modelRunId).toBe("1234");
    expect(state.status).toStrictEqual({success: true});
    expect(state.ready).toBe(false);
});
