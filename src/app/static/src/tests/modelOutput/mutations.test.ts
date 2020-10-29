import {mutations, ModelOutputMutation} from "../../app/store/modelOutput/mutations";

describe("Model output mutations", () => {
    it("sets selected tab", () => {
        const testState = {selectedTab: ""};
        mutations[ModelOutputMutation.TabSelected](testState, "Map");
        expect(testState.selectedTab).toBe("Map");
    });
});