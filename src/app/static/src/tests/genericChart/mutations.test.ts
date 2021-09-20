import {mutations} from "../../app/store/genericChart/mutations";
;import {mockGenericChartState} from "../mocks";

describe("genericChart mutations", () => {
    it("updates generic chart metadata", () => {
        const state = mockGenericChartState();
        const testMetadata = {metadata: "test"};
        mutations.GenericChartMetadataFetched(state, {payload: testMetadata});
        expect(state.genericChartMetadata).toBe(testMetadata);
    });

    it("sets dataset",  () => {
        const state = mockGenericChartState();
        const payload = {datasetId: "dataset1", dataset: ["TEST DATASET"]};
        mutations.SetDataset(state, {payload});
        expect(state.datasets).toStrictEqual({dataset1: ["TEST DATASET"]});
    });

    it("can clear datasets",  () => {
        const state = mockGenericChartState();
        mutations.ClearDataset(state);
        expect(state.datasets).toEqual({});
    });

    it("sets error", () => {
        const state = mockGenericChartState();
        const error = {"detail": "TEST ERROR", "error": "OTHER_ERROR"};
        mutations.SetError(state, {payload: error});
        expect(state.genericChartError).toBe(error);
    });
});
