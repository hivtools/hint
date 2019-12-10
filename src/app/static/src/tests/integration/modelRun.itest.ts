import {actions, makeCancelRunRequest} from "../../app/store/modelRun/actions";
import {login} from "./integrationTest";
import {ModelSubmitResponse} from "../../app/generated";
import {RootState} from "../../app/root";
import {ModelRunState} from "../../app/store/modelRun/modelRun";
import {mockModelStatusResponse} from "../mocks";

describe("Model run actions", () => {

    let runId = "";
    beforeAll(async () => {
        await login();
        const commit = jest.fn();
        const mockState = {
            modelOptions: {
                options: {},
                version: {hintr: "unknown", naomi: "unknown", rrq: "unknown"}
            }
        } as RootState;
        await actions.run({commit, rootState: mockState} as any);
        runId = (commit.mock.calls[0][0]["payload"] as ModelSubmitResponse).id;
    });

    it("can trigger model run", async () => {
        const commit = jest.fn();
        const mockState = {
            modelOptions: {
                options: {},
                version: {hintr: "unknown", naomi: "unknown", rrq: "unknown"}
            }
        } as RootState;
        await actions.run({commit, rootState: mockState} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe("ModelRunError");
        expect(commit.mock.calls[0][0]["payload"].detail).toBe("Trying to run model with old version of options. Update model run options");
    });

    it("can get model run status", (done) => {
        const commit = jest.fn();
        const mockState = {status: {done: true}} as ModelRunState;

        actions.poll({commit, state: mockState, dispatch: jest.fn()} as any, runId);
        expect(commit.mock.calls[0][0]["type"]).toBe("PollingForStatusStarted");
        const pollingInterval = (commit.mock.calls[0][0]["payload"]);

        const testInterval = setInterval(() => {
            if (commit.mock.calls.length == 2) {
                expect(commit.mock.calls[1][0]["type"]).toBe("RunStatusUpdated");
                clearInterval(pollingInterval);
                clearInterval(testInterval);
                done();
            }

        })
    });

    it("can get model run result", async () => {
        const commit = jest.fn();
        const mockState = {
            modelRunId: "1234",
            status: {
                done: true,
                id: "1234"
            }
        } as ModelRunState;
        await actions.getResult({commit, state: mockState} as any);

        // passing an invalid run id so this will return an error
        // but the expected error message confirms
        // that we're hitting the correct endpoint
        expect(commit.mock.calls[0][0]["type"]).toBe("RunResultError");
        expect(commit.mock.calls[0][0]["payload"].detail).toBe("Missing some results");
    });

    it("can cancel model run", async () => {
        const commit = jest.fn();
        const mockState = {
            modelRunId: "1234"
        } as ModelRunState;

        await actions.cancelRun({commit, state: mockState} as any);

        expect(commit.mock.calls[0][0]["type"]).toBe("RunCancelled");
        expect(commit.mock.calls[0][0]["payload"]).toBeNull();
    });

    it ("makeCancelRunRequest gets response from API", async () => {
        //TODO: regenerate types when hintr change goes in and expect the actual response type
        //in the API call rather than null
        const commit = jest.fn();
        const mockState = {
            modelRunId: "1234"
        } as ModelRunState;
        const result = await makeCancelRunRequest(commit, mockState);
        expect(result).toBeUndefined();
    });
});
