import Vue from "vue";
import {mutations} from "../../app/store/genericChart/mutations";
import {mockGenericChartState} from "../mocks";

describe("genericChart mutations", () => {

    it("updates generic chart metadata", () => {
        const state = mockGenericChartState();
        const testMetadata = {metadata: "test"};
        mutations.GenericChartMetadataFetched(state, {payload: testMetadata});
        expect(state.genericChartMetadata).toBe(testMetadata);
    });

    it("sets dataset",  () => {
        const state = mockGenericChartState();
        const vueSetSpy = jest.spyOn(Vue, "set");
        const payload = {datasetId: "dataset1", dataset: ["TEST DATASET"]};
        mutations.SetDataset(state, {payload});
        expect(state.datasets).toStrictEqual({dataset1: ["TEST DATASET"]});
        expect(vueSetSpy.mock.calls[0][0]).toBe(state.datasets);
        expect(vueSetSpy.mock.calls[0][1]).toBe("dataset1");
        expect(vueSetSpy.mock.calls[0][2]).toStrictEqual(["TEST DATASET"]);
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
});
