import {mutations, ModelOutputMutation} from "../../app/store/modelOutput/mutations";
import {mockModelOutputState} from "../mocks";
import {ModelOutputTabs} from "../../app/types";

describe("Model output mutations", () => {
    it("sets selected tab", () => {
        const testState = mockModelOutputState({selectedTab: ""});
        mutations[ModelOutputMutation.TabSelected](testState, {payload: ModelOutputTabs.Map});
        expect(testState.selectedTab).toBe(ModelOutputTabs.Map);
    });
});
