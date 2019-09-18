import {initialModelRunState} from "../../app/store/modelRun/modelRun";
import {mutations} from "../../app/store/modelRun/mutations";

describe("Model run mutations", () => {

    it("sets model run id", () => {
        const testState = {...initialModelRunState};
        mutations.ModelRunStarted(testState, {payload: {id: "1234"}});
        expect(testState.modelRunId).toBe("1234");
    });
});
