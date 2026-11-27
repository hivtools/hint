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

import {modelRun, type ModelRunState} from "../../app/store/modelRun/modelRun";

it("loads initial state from existingState, but resets ready to false", () => {
    const state = modelRun(existingState).state as ModelRunState;
    expect(state.modelRunId).toBe("1234");
    expect(state.status).toStrictEqual({success: true});
    expect(state.ready).toBe(false);
});
