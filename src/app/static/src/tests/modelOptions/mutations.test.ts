import {mockModelOptionsState} from "../mocks";
import {mutations} from "../../app/store/modelOptions/mutations";

describe("Model run options mutations", () => {

    it("sets valid", () => {
        const state = mockModelOptionsState();
        mutations.ModelOptionsValidated(state);
        expect(state.valid).toBe(true);
    });

});
