import {mutations} from "../../app/store/genericChart/mutations";
;import {mockGenericChartState} from "../mocks";

describe("genericChart mutations", () => {
    it("updates generic chart metadata", () => {
        const state = mockGenericChartState();
        const testMetadata = {metadata: "test"};
        mutations.GenericChartMetadataFetched(state, {payload: testMetadata});
        expect(state.genericChartMetadata).toBe(testMetadata);
    });
});
