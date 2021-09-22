import {mutations} from "../../app/store/genericChart/mutations";
;import {mockGenericChartState} from "../mocks";

describe("genericChart mutations", () => {
    const datasets = {
        art: {
            data: [{type: "test", value: "test"}],
            metadata: {
                filters: [
                    {
                        id: "type",
                        column_id: "type",
                        label: "Type",
                        allowMultiple: false,
                        options: [{id: "test", label: "test"}]
                    }
                ],
                defaults: {
                    selected_filter_options: {
                        type: [{id: "test", label: "test"}]
                    }
                }
            }
        },
        anc: {
            data: [{type: "test2", value: "test2"}],
            metadata: {
                filters: [
                    {
                        id: "type2",
                        column_id: "type2",
                        label: "Type2",
                        allowMultiple: false,
                        options: [{id: "test2", label: "test2"}]
                    }
                ],
                defaults: {
                    selected_filter_options: {
                        type: [{id: "test2", label: "test2"}]
                    }
                }
            }
        }
    } as any;

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

    it("can clear anc datasets",  () => {
        const state = mockGenericChartState({datasets: datasets});
        mutations.ClearDataset(state, {payload: "anc"});
        expect(state.datasets["anc"]).toEqual({});
        expect(state.datasets["art"]).toEqual(datasets["art"]);
    });

    it("can clear art datasets",  () => {
        const state = mockGenericChartState({datasets: datasets});
        mutations.ClearDataset(state, {payload: "art"});
        expect(state.datasets["art"]).toEqual({});
        expect(state.datasets["anc"]).toEqual(datasets["anc"]);
    });

    it("sets error", () => {
        const state = mockGenericChartState();
        const error = {"detail": "TEST ERROR", "error": "OTHER_ERROR"};
        mutations.SetError(state, {payload: error});
        expect(state.genericChartError).toBe(error);
    });
});
