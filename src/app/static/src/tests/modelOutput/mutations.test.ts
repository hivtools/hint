import {mutations, ModelOutputMutation} from "../../app/store/modelOutput/mutations";
import {mockModelOutputState} from "../mocks";

describe("Model output mutations", () => {
    it("sets selected tab", () => {
        const testState = mockModelOutputState({selectedTab: ""});
        mutations[ModelOutputMutation.TabSelected](testState, "Map");
        expect(testState.selectedTab).toBe("Map");
    });
});