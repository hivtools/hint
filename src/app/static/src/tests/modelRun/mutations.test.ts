import {initialModelRunState} from "../../app/store/modelRun/modelRun";
import {mutations} from "../../app/store/modelRun/mutations";
import {mockModelResultResponse} from "../mocks";

describe("Model run mutations", () => {

    afterEach(() => {
        localStorage.clear();
    });

    it("sets status", () => {
        const testState = {...initialModelRunState};
        mutations.ModelRunStarted(testState, {payload: {id: "1234"}});
        expect(testState.modelRunId).toBe("1234");
        expect(testState.status).toStrictEqual({id: "1234"});
    });

    it("sets run status, success and poll id when done", () => {
        const testState = {...initialModelRunState};
        mutations.RunStatusUpdated(testState, {payload: {id: "1234", done: true, success: true}});
        expect(testState.status.success).toBe(true);
        expect(testState.status).toStrictEqual({id: "1234", done: true, success: true});
        expect(testState.statusPollId).toBe(-1);
    });

    it("does not update poll id if not done", () => {
        const testState = {...initialModelRunState, statusPollId: 10};
        mutations.RunStatusUpdated(testState, {payload: {done: false}});
        expect(testState.statusPollId).toBe(10);
    });

    it("sets poll id", () => {
        const testState = {...initialModelRunState};
        mutations.PollingForStatusStarted(testState, {payload: 2});
        expect(testState.statusPollId).toBe(2);
    });

    it("sets result", () => {
        const testState = {...initialModelRunState};
        const testResponse = mockModelResultResponse();
        mutations.RunResultFetched(testState, {payload: testResponse});
        expect(testState.result).toBe(testResponse);
    });

    it("sets result error", () => {
        const testState = {...initialModelRunState};
        mutations.RunResultError(testState, {payload: "Test Error"});
        expect(testState.errors).toStrictEqual(["Test Error"]);
    });

});
