import {initialModelRunState, ModelRunStatus} from "../../app/store/modelRun/modelRun";
import {mutations} from "../../app/store/modelRun/mutations";

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

    it("sets run status, success and poll id when done", () => {
        const testState = {...initialModelRunState};
        mutations.RunStatusUpdated(testState, {payload: {id: "1234", done: true, success: true}});
        expect(testState.success).toBe(true);
        expect(testState.status).toBe(ModelRunStatus.Complete);
        expect(testState.statusPollId).toBe(-1);
    });

    it("does not update status if not done", () => {
        const testState = {...initialModelRunState, status: ModelRunStatus.Started};
        mutations.RunStatusUpdated(testState, {payload: {id: "1234", done: false}});
        expect(testState.status).toBe(ModelRunStatus.Started);
    });

    it("does not update success if not successful", () => {
        const testState = {...initialModelRunState};
        mutations.RunStatusUpdated(testState, {payload: {id: "1234", done: true, success: false}});
        expect(testState.status).toBe(ModelRunStatus.Complete);
        expect(testState.success).toBe(false);
    });

    it("sets poll id", () => {
        const testState = {...initialModelRunState};
        mutations.PollingForStatusStarted(testState, {payload: 2});
        expect(testState.statusPollId).toBe(2);
    });

});
