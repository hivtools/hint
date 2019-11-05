import {actions} from "../../app/store/modelRun/actions";
import {login} from "./integrationTest";
import {ModelSubmitResponse} from "../../app/generated";
import {RootState} from "../../app/root";
import {ModelRunState} from "../../app/store/modelRun/modelRun";

describe("Model run actions", () => {

    let runId = "";
    beforeAll(async () => {
        await login();
        const commit = jest.fn();
        const mockState = {
            modelOptions: {
                options: {}
            }
        } as RootState;
        await actions.run({commit, rootState: mockState} as any);
        runId = (commit.mock.calls[0][0]["payload"] as ModelSubmitResponse).id;
    });

    it("can trigger model run", async () => {
        const commit = jest.fn();
        const mockState = {
            modelOptions: {
                options: {}
            }
        } as RootState;
        await actions.run({commit, rootState: mockState} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe("ModelRunStarted");
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
                id: runId
            }
        } as ModelRunState;
        await actions.getResult({commit, state: mockState} as any);

        // passing an invalid run id so this will return an error
        // but the expected error message confirms
        // that we're hitting the correct endpoint
        expect(commit.mock.calls[0][0]["type"]).toBe("RunResultError");
        expect(commit.mock.calls[0][0]["payload"]).toBe("Missing some results");
    });

});
