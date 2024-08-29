import {mutations} from "../../app/store/genericChart/mutations";
import {mockGenericChartState, mockWarning} from "../mocks";

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
        expect(state.selectionDatasetId).toStrictEqual("dataset1");
    });

    it("sets loading",  () => {
        const state = mockGenericChartState();
        const payload = true;
        mutations.SetLoading(state, {payload});
        expect(state.loading).toBe(true);
    });

    it("can clear anc datasets", () => {
        const datasets = {
            art: {
                data: [{type: "test", value: "test"}],
                metadata: "TEST"
            },
            anc: {
                data: [{type: "test2", value: "test2"}],
                metadata: "TEST"
            }
        } as any;
        const state = mockGenericChartState({datasets: datasets});
        mutations.ClearDataset(state, {payload: "anc"});
        expect(state.datasets).toEqual({
            art: {
                data: [{type: "test", value: "test"}],
                metadata: "TEST"
            }
        });
    });

    it("can clear art datasets", () => {
        const datasets = {
            art: {
                data: [{type: "test", value: "test"}],
                metadata: "TEST"
            },
            anc: {
                data: [{type: "test2", value: "test2"}],
                metadata: "TEST"
            }
        } as any;
        const state = mockGenericChartState({datasets: datasets});
        mutations.ClearDataset(state, {payload: "art"});
        expect(state.datasets).toEqual({
            anc: {
                data: [{type: "test2", value: "test2"}],
                metadata: "TEST"
            }
        });
    });

    it("sets error", () => {
        const state = mockGenericChartState();
        const error = {"detail": "TEST ERROR", "error": "OTHER_ERROR"};
        mutations.SetError(state, {payload: error});
        expect(state.genericChartError).toBe(error);
    });

    it("sets and clears warnings", () => {
        const testState = mockGenericChartState();
        const warnings = [mockWarning()]
        mutations.WarningsFetched(testState, {payload: warnings});
        expect(testState.warnings).toEqual([mockWarning()]);
        mutations.ClearWarnings(testState);
        expect(testState.warnings).toEqual([]);
    });
});
