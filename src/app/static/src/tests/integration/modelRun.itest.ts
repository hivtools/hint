import {actions} from "../../app/store/modelRun/actions";
import {login} from "./integrationTest";
import {mockRootState} from "../mocks";
import {ModelSubmitResponse} from "../../app/generated";

describe("Model run actions", () => {

    beforeAll(async () => {
        await login();
    });

    it("can trigger model run", async () => {
        const commit = jest.fn();

        await actions.run({commit, rootState: mockRootState()} as any);
        expect(commit.mock.calls[0][0]["type"]).toBe("ModelRunStarted");
    });

    it("can get model run status", async () => {
        const commit = jest.fn();

        await actions.run({commit, rootState: mockRootState()} as any);
        const runId = (commit.mock.calls[0][0]["payload"] as ModelSubmitResponse).id;
        await actions.poll({commit, rootState: mockRootState()} as any, runId);
        expect(commit.mock.calls[0][0]["type"]).toBe("PollingForStatusStarted");

        setTimeout(() => {
            expect(commit.mock.calls[1][0]["type"]).toBe("RunStatusUpdated");
        }, 2500)
    });

});
