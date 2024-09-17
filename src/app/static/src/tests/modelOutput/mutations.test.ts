import {mockModelOutputState} from "../mocks";
import {mutations} from "../../app/store/modelOutput/mutations";
import {ModelOutputMutation} from "../../app/store/modelOutput/mutations";

describe("Model output mutations", () => {

    it("sets selected tab", () => {
        const state = mockModelOutputState();
        mutations[ModelOutputMutation.TabSelected](state, {payload: "choropleth"});
        expect(state.selectedTab).toStrictEqual("choropleth");
    });
})
