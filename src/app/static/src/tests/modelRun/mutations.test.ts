import {initialModelRunState} from "../../app/store/modelRun/modelRun";
import {ModelRunMutation, mutations} from "../../app/store/modelRun/mutations";
import {mockError, mockModelResultResponse, mockModelRunState} from "../mocks";
import {expectAllMutationsDefined} from "../mutationTestHelper";
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

    it("run status error adds error and stops polling if max errors exceeded", () => {
        const error1 = mockError("1");
        const error2 = mockError("2");
        const error3 = mockError("3");
        const error4 =  mockError("4");
        const testState = mockModelRunState({
            errors: [error1, error2, error3, error4],
            statusPollId: 999,
            status: {done: false} as ModelStatusResponse,
            modelRunId: "123"
        });

        const error5 = mockError("5");
        mutations.RunStatusError(testState, {payload: error5});

        expect(testState.errors).toStrictEqual([
            error1, error2, error3, error4, error5,
            {
                error: "Unable to retrieve model run status. Please retry the model run, or contact support if the error persists.",
                detail: null
            }
         ]);
        expect(testState.statusPollId).toEqual(-1);
        expect(testState.status).toStrictEqual({});
        expect(testState.modelRunId).toStrictEqual("");
    });

    it ("run status error ads errors and does not stop polling if max errors not exceeded", () => {
        const testState = mockModelRunState({
            errors: [],
            statusPollId: 999,
            status: {done: false} as ModelStatusResponse,
            modelRunId: "123"
        });

        mutations.RunStatusError(testState, {payload: "1"});

        expect(testState.errors).toStrictEqual(["1"]);
        expect(testState.statusPollId).toEqual(999);
        expect(testState.status).toStrictEqual({done: false});
        expect(testState.modelRunId).toStrictEqual("123");
    });
});
