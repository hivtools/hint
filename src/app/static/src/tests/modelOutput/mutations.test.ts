import {mutations, ModelOutputMutation} from "../../app/store/modelOutput/mutations";

// const testState1 = {selectedTab: "", changes: false, selections: {key1: 'test'}};
// const testState2 = {selectedTab: "map", changes: false, selections: {key1: 'test'}};

describe("Model output mutations", () => {
    it("sets selected tab", () => {
        const testState = {selectedTab: "", changes: false, selections: {}};
        mutations[ModelOutputMutation.TabSelected](testState, "Map");
        expect(testState.selectedTab).toBe("Map");
    });

    it("registers user updates to map correctly", () => {
        const testState = {selectedTab: "map", changes: false, selections: {key1_map: 'test'}};
        mutations[ModelOutputMutation.Update](testState, {key2: 'test'});
        expect(testState.changes).toBe(false);
        expect(testState.selections).toStrictEqual({key1_map: 'test', key2_map: 'test'});
        mutations[ModelOutputMutation.Update](testState, {key1: 'test'});
        expect(testState.changes).toBe(false);
        mutations[ModelOutputMutation.Update](testState, {key3: {key3: 'test2'}});
        expect(testState.changes).toBe(false);
        expect(testState.selections).toStrictEqual({key1_map: 'test', key2_map: 'test', key3_map: {key3: 'test2'}});
        mutations[ModelOutputMutation.Update](testState, {key1: 'test2'});
        expect(testState.changes).toBe(true);
        expect(testState.selections).toStrictEqual({key1_map: 'test', key2_map: 'test', key3_map: {key3: 'test2'}});
    });

    it("registers any updates to barchart as user updates", () => {
        const testState = {selectedTab: "bar", changes: false, selections: {}};
        mutations[ModelOutputMutation.Update](testState, {key2: 'test'});
        expect(testState.changes).toBe(true);
        expect(testState.selections).toStrictEqual({});
    });
});