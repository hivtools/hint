import {mutations, ModelOutputMutation} from "../../app/store/modelOutput/mutations";
import {mockModelOutputState} from "../mocks";
import {ModelOutputTabs} from "../../app/types";

describe("Model output mutations", () => {
    it("sets selected tab", () => {
        const testState = mockModelOutputState({selectedTab: ""});
        mutations[ModelOutputMutation.TabSelected](testState, {payload: ModelOutputTabs.Map});
        expect(testState.selectedTab).toBe(ModelOutputTabs.Map);
    });

    it("sets tab loading", () => {
        const testState = mockModelOutputState({
            loading: {
                map: false,
                bar: false,
                comparison: false,
                bubble: false,
                table: false
            }
        });
        mutations[ModelOutputMutation.SetTabLoading](testState, {payload: {tab: ModelOutputTabs.Map, loading: true}});
        expect(testState.loading).toStrictEqual({
            map: true,
            bar: false,
            comparison: false,
            bubble: false,
            table: false
        });
    });
});
