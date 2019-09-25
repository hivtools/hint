import {initialModelRunState, localStorageKey, ModelRunState, ModelRunStatus} from "../../app/store/modelRun/modelRun";
import {mutations} from "../../app/store/modelRun/mutations";
import {localStorageManager} from "../../app/localStorageManager";

describe("Model run mutations", () => {

    afterEach(() => {
        localStorage.clear();
    });

    it("sets model run id and status", () => {
        const testState = {...initialModelRunState};
        mutations.ModelRunStarted(testState, {payload: {id: "1234"}});
        expect(testState.modelRunId).toBe("1234");
        expect(testState.status).toBe(ModelRunStatus.Started);
    });

    it("saves state in localStorage when run started", () => {

        const testState = {...initialModelRunState};
        mutations.ModelRunStarted(testState, {payload: {id: "1234"}});

        const savedState = localStorageManager.getItem<ModelRunState>(localStorageKey)!!;
        expect(savedState.modelRunId).toBe("1234");
        expect(savedState.status).toBe(ModelRunStatus.Started);
    });

    it("saves state in localStorage when status updated", () => {

        const testState = {...initialModelRunState};
        mutations.RunStatusUpdated(testState, {
            payload: {
                id: "1234",
                success: true,
                done: true,
                queue: 1,
                progress: "",
                timeRemaining: "",
                status: "running"
            }
        });

        const savedState = localStorageManager.getItem<ModelRunState>(localStorageKey)!!;
        expect(savedState.status).toBe(ModelRunStatus.Complete);
        expect(savedState.success).toBe(true);
    });

});
