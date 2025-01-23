import {mockADRDatasetState, mockADRDataState, mockADRState, mockError} from "../mocks";
import {ADRMutation, mutations} from "../../src/store/adr/mutations";
import {AdrDatasetType} from "../../src/store/adr/adr";

describe("ADR mutations", () => {
    it("can update key", () => {
        const state = mockADRState();
        mutations[ADRMutation.UpdateKey](state, {payload: "new-key"});
        expect(state.key).toBe("new-key");

        mutations[ADRMutation.UpdateKey](state, {payload: null});
        expect(state.key).toBe(null);
    });

    it("can set ssoLogin", () => {
        const state = mockADRState();
        mutations[ADRMutation.SetSSOLogin](state, {payload: true});
        expect(state.ssoLogin).toBe(true);
    });

    it("can set key error", () => {
        const state = mockADRState();
        mutations[ADRMutation.SetKeyError](state, {payload: mockError("whatevs")});
        expect(state.keyError!!.detail).toBe("whatevs");

        mutations[ADRMutation.SetKeyError](state, {payload: null});
        expect(state.keyError).toBe(null);
    });

    it.each(Object.values(AdrDatasetType))("can set adr error", (datasetType: AdrDatasetType) => {
        const state = mockADRState();
        mutations[ADRMutation.SetADRError](state, {payload: {data: mockError("whatevs"), datasetType}});
        expect(state.adrData[datasetType].fetchingError!!.detail).toBe("whatevs");

        mutations[ADRMutation.SetADRError](state, {payload: {data: null, datasetType}});
        expect(state.adrData[datasetType].fetchingError).toBe(null);
    });

    it.each(Object.values(AdrDatasetType))("can set datasets", (datasetType: AdrDatasetType) => {
        const state = mockADRState();
        mutations[ADRMutation.SetDatasets](state, {payload: {data: [1, 2, 3], datasetType}});
        expect(state.adrData[datasetType].datasets).toEqual([1, 2, 3]);
    });

    it.each(Object.values(AdrDatasetType))("can set fetching datasets", (datasetType: AdrDatasetType) => {
        const state = mockADRState({
            adrData: mockADRDataState({
                [datasetType]: mockADRDatasetState({fetchingDatasets: false})
            })
        });
        mutations[ADRMutation.SetFetchingDatasets](state, {payload: {data: true, datasetType}});
        expect(state.adrData[datasetType].fetchingDatasets).toBe(true);
    });

    it.each(Object.values(AdrDatasetType))("can set releases", (datasetType: AdrDatasetType) => {
        const state = mockADRState();
        mutations[ADRMutation.SetReleases](state, {payload: {data: [1, 2, 3], datasetType}});
        expect(state.adrData[datasetType].releases).toEqual([1, 2, 3]);
    });

    it.each(Object.values(AdrDatasetType))("can clear releases", (datasetType: AdrDatasetType) => {
        const state = mockADRState({
            adrData: mockADRDataState({
                [datasetType]: mockADRDatasetState({releases: [1, 2, 3]})
            })
        });
        mutations[ADRMutation.ClearReleases](state, {payload: {datasetType}});
        expect(state.adrData[datasetType].releases).toEqual([]);
    });

    it("can set schemas", () => {
        const state = mockADRState();
        mutations[ADRMutation.SetSchemas](state, {payload: {baseUrl: "adr.com"}});
        expect(state.schemas).toEqual({baseUrl: "adr.com"});
    });

    it("can set user can upload", () => {
        const state = mockADRState();
        mutations[ADRMutation.SetUserCanUpload](state, {payload: true});
        expect(state.userCanUpload).toBe(true);
    });

});
