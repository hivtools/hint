import {localStorageManager} from "../../app/localStorageManager";

localStorageManager.setItem("modelRun", {modelRunId: "1234", status: 2, success: true});

import {initialModelRunState} from "../../app/store/modelRun/modelRun";

it("loads initial state from local storage", () => {
    expect(initialModelRunState.success).toBe(true);
    expect(initialModelRunState.modelRunId).toBe("1234");
    expect(initialModelRunState.status).toBe(2);
});
