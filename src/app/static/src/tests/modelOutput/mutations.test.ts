import {mutations, ModelOutputMutation} from "../../app/store/modelOutput/mutations";
import {mockModelOutputState} from "../mocks";
import {ModelOutputTabs} from "../../app/types";

describe("Model output mutations", () => {
    it("sets selected tab", () => {
        const testState = mockModelOutputState({selectedTab: ""});
        mutations[ModelOutputMutation.TabSelected](testState, {payload: ModelOutputTabs.Map});
        expect(testState.selectedTab).toBe(ModelOutputTabs.Map);
    });

    it("adds indicator being fetched", () => {
        const testState = mockModelOutputState({indicatorsBeingFetched: ["indicator1"]});
        mutations[ModelOutputMutation.AddIndicatorBeingFetched](testState, {payload: "indicator2"});
        expect(testState.indicatorsBeingFetched).toStrictEqual(["indicator1", "indicator2"]);
    });

    it("removes indicator being fetched", () => {
        const testState = mockModelOutputState({indicatorsBeingFetched: ["indicator1", "indicator2"]});
        mutations[ModelOutputMutation.RemoveIndicatorBeingFetched](testState, {payload: "indicator2"});
        expect(testState.indicatorsBeingFetched).toStrictEqual(["indicator1"]);
    });
});
