import {mockError, mockADRState} from "../mocks";
import {mutations, ADRMutation} from "../../app/store/adr/mutations";

describe("ADR mutations", () => {
    it("can update key", () => {
        const state = mockADRState();
        mutations[ADRMutation.UpdateKey](state, {payload: "new-key"});
        expect(state.key).toBe("new-key");

        mutations[ADRMutation.UpdateKey](state, {payload: null});
        expect(state.key).toBe(null);
    });

    it("can set key error", () => {
        const state = mockADRState();
        mutations[ADRMutation.SetKeyError](state, {payload: mockError("whatevs")});
        expect(state.keyError!!.detail).toBe("whatevs");

        mutations[ADRMutation.SetKeyError](state, {payload: null});
        expect(state.keyError).toBe(null);
    });

    it("can set adr error", () => {
        const state = mockADRState();
        mutations[ADRMutation.SetADRError](state, {payload: mockError("whatevs")});
        expect(state.adrError!!.detail).toBe("whatevs");

        mutations[ADRMutation.SetADRError](state, {payload: null});
        expect(state.adrError).toBe(null);
    });

    it("can set datasets", () => {
        const state = mockADRState();
        mutations[ADRMutation.SetDatasets](state, {payload: [1, 2, 3]});
        expect(state.datasets).toEqual([1, 2, 3]);
    });

    it("can set fetching datasets", () => {
        const state = mockADRState({fetchingDatasets: false});
        mutations[ADRMutation.SetFetchingDatasets](state, {payload: true});
        expect(state.fetchingDatasets).toBe(true);
    });

    it("can set schemas", () => {
        const state = mockADRState();
        mutations[ADRMutation.SetSchemas](state, {payload: {baseUrl: "adr.com"}});
        expect(state.schemas).toEqual({baseUrl: "adr.com"});
    });

    it("can set upload files", () => {
        const state = mockADRState();
        const payload = {
            outputZip: {
                index: 1,
                displayName: "test",
                resourceType: "testType",
                resourceFilename: "testFile",
                resourceId: "123",
                lastModified: "2021-03-02",
                url: "https://test"
            }
        };
        mutations[ADRMutation.SetUploadFiles](state, {payload});
        expect(state.uploadFiles).toBe(payload);
    });

    it("can set Capacity", () => {
        const state = mockADRState();
        mutations[ADRMutation.SetCapacity](state, {payload: "admin"});
        expect(state.capacity).toEqual("admin");

        mutations[ADRMutation.SetCapacity](state, {payload: null});
        expect(state.capacity).toEqual(null);
    });

});
