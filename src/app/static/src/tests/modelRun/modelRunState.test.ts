import {localStorageManager} from "../../app/localStorageManager";

localStorageManager.saveState({
    modelRun: {
        modelRunId: "1234",
        status: 2,
        success: true,
        errors: [],
        statusPollId: -1
    }
} as any);

import {modelRun, ModelRunState} from "../../app/store/modelRun/modelRun";

it("loads initial state from local storage", () => {
    const state = modelRun.state as ModelRunState;
    expect(state.success).toBe(true);
    expect(state.modelRunId).toBe("1234");
    expect(state.status).toBe(2);
});
