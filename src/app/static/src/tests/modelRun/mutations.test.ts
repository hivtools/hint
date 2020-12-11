import {ModelRunMutation, mutations} from "../../app/store/modelRun/mutations";
import {mockError, mockModelResultResponse, mockModelRunState, mockModelStatusResponse} from "../mocks";
import {expectAllMutationsDefined} from "../testHelpers";
import {ModelStatusResponse} from "../../app/generated";

describe("Model run mutations", () => {

    afterEach(() => {
        localStorage.clear();
    });

    it("all mutation types are defined", () => {
        expectAllMutationsDefined(ModelRunMutation, mutations);
    });

    it("sets status and clears errors when started", () => {
        const testState = mockModelRunState({errors: [mockError("1"), mockError("2"), mockError("3")]});
        mutations.ModelRunStarted(testState, {payload: {id: "1234"}});
        expect(testState.modelRunId).toBe("1234");
        expect(testState.status).toStrictEqual({id: "1234"});
        expect(testState.errors).toStrictEqual([]);
    });

    it("sets run status, success and poll id when done", () => {
        const testState = mockModelRunState();
        mutations.RunStatusUpdated(testState, {payload: {id: "1234", done: true, success: true}});
        expect(testState.status.success).toBe(true);
        expect(testState.status).toStrictEqual({id: "1234", done: true, success: true});
        expect(testState.statusPollId).toBe(-1);
    });

    it("successful run status update clears errors", () => {
        const testState = mockModelRunState({errors: [mockError("error 1")]});
        mutations.RunStatusUpdated(testState, {payload: {id: "1234", done: true, success: true}});
        expect(testState.errors).toStrictEqual([]);
    });

    it("does not update poll id if not done", () => {
        const testState = mockModelRunState({statusPollId: 10});
        mutations.RunStatusUpdated(testState, {payload: {done: false}});
        expect(testState.statusPollId).toBe(10);
    });

    it("sets poll id", () => {
        const testState = mockModelRunState();
        mutations.PollingForStatusStarted(testState, {payload: 2});
        expect(testState.statusPollId).toBe(2);
    });

    it("sets result", () => {
        const testState = mockModelRunState();
        const testResponse = mockModelResultResponse();
        mutations.RunResultFetched(testState, {payload: testResponse});
        expect(testState.result).toBe(testResponse);
    });

    it("sets result error", () => {
        const testState = mockModelRunState();
        mutations.RunResultError(testState, {payload: "Test Error"});
        expect(testState.errors).toStrictEqual(["Test Error"]);
    });

    it("sets run error", () => {
        const testState = mockModelRunState();
        mutations.ModelRunError(testState, {payload: "Test Error"});
        expect(testState.errors).toStrictEqual(["Test Error"]);
    });

    it("run status adds error and stops polling if maxPollErrors exceeded", () => {
        const testState = mockModelRunState({
            errors : [],
            statusPollId: 999,
            status: {done: false} as ModelStatusResponse,
            modelRunId: "123",
            pollingCounter: 150
        });
        mutations.RunStatusError(testState, {payload: "1"});
        expect(testState.errors).toStrictEqual([
            {
                error: "Unable to retrieve model run status. Please retry the model run, or contact support if the error persists.",
                detail: null
            }
        ]);
        expect(testState.statusPollId).toEqual(-1);
        expect(testState.status).toStrictEqual({});
        expect(testState.modelRunId).toStrictEqual("");
    });

    it("run status error and does not stop polling if maxPollErrors not exceeded", () => {
        const testState = mockModelRunState({
            errors: [],
            statusPollId: 999,
            status: {done: false} as ModelStatusResponse,
            modelRunId: "123",
            pollingCounter: 9
        });
        mutations.RunStatusError(testState, {payload: "1"});
        expect(testState.errors).toStrictEqual([]);
        expect(testState.statusPollId).toEqual(999);
        expect(testState.status).toStrictEqual({done: false});
        expect(testState.modelRunId).toStrictEqual("123");
    });

    it("cancel run resets state", () => {
        const testState = mockModelRunState({
            modelRunId: "123",
            statusPollId: 1,
            status: mockModelStatusResponse(),
            errors: [mockError("testError")],
            result: mockModelResultResponse()
        });

        mutations.RunCancelled(testState);
        expect(testState.modelRunId).toBe("");
        expect(testState.statusPollId).toBe(-1);
        expect(testState.status).toStrictEqual({});
        expect(testState.errors).toStrictEqual([]);
        expect(testState.result).toBeNull();
    });
});
