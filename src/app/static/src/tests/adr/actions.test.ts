import {
    mockADRState,
    mockAxios,
    mockBaselineState,
    mockError,
    mockFailure,
    mockRootState,
    mockSuccess
} from "../mocks";
import {actions} from "../../app/store/adr/actions";
import {ADRMutation} from "../../app/store/adr/mutations";

describe("ADR actions", () => {
    const state = mockADRState();
    const rootState = mockRootState();

    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
    });

    it("fetches key", async () => {
        mockAxios.onGet(`/adr/key/`)
            .reply(200, mockSuccess("1234"));

        const commit = jest.fn();

        await actions.fetchKey({commit, state, rootState} as any);

        expect(commit.mock.calls[0][0])
            .toStrictEqual({
                type: ADRMutation.UpdateKey,
                payload: "1234"
            });
    });

    it("saves key", async () => {
        mockAxios.onPost(`/adr/key/`)
            .reply(200, mockSuccess("1234"));

        const commit = jest.fn();

        await actions.saveKey({commit, state, rootState} as any, "1234");

        expect(commit.mock.calls[0][0])
            .toStrictEqual({
                type: ADRMutation.SetKeyError,
                payload: null
            });
        expect(commit.mock.calls[1][0])
            .toStrictEqual({
                type: ADRMutation.UpdateKey,
                payload: "1234"
            });
    });

    it("deletes key", async () => {
        mockAxios.onDelete(`/adr/key/`)
            .reply(200, mockSuccess(null));

        const commit = jest.fn();

        await actions.deleteKey({commit, state, rootState} as any);

        expect(commit.mock.calls[0][0])
            .toStrictEqual({
                type:ADRMutation.SetKeyError,
                payload: null
            });
        expect(commit.mock.calls[1][0])
            .toStrictEqual({
                type: ADRMutation.UpdateKey,
                payload: null
            });
    });

    it("fetches datasets", async () => {
        mockAxios.onGet(`/adr/datasets/`)
            .reply(200, mockSuccess([1]));

        const commit = jest.fn();

        await actions.getDatasets({commit, state, rootState} as any);

        expect(commit.mock.calls.length).toBe(4);
        expect(commit.mock.calls[0][0])
            .toStrictEqual({
                type: ADRMutation.SetFetchingDatasets,
                payload: true
            });
        expect(commit.mock.calls[1][0])
            .toStrictEqual({
                type: ADRMutation.SetADRError,
                payload: null
            });
        expect(commit.mock.calls[2][0])
            .toStrictEqual({
                type: ADRMutation.SetDatasets,
                payload: [1]
            });
        expect(commit.mock.calls[3][0])
            .toStrictEqual({
                type: ADRMutation.SetFetchingDatasets,
                payload: false
            });
    });

    it("resets datasets and commits error fetching if error response", async () => {
        mockAxios.onGet(`/adr/datasets/`)
            .reply(500, mockFailure("error"));

        const commit = jest.fn();

        await actions.getDatasets({commit, state, rootState} as any);

        expect(commit.mock.calls.length).toBe(4);
        expect(commit.mock.calls[0][0])
            .toStrictEqual({
                type: ADRMutation.SetFetchingDatasets,
                payload: true
            });
        expect(commit.mock.calls[1][0])
            .toStrictEqual({
                type: ADRMutation.SetADRError,
                payload: null
            });
        expect(commit.mock.calls[2][0])
            .toStrictEqual({
                type: ADRMutation.SetADRError,
                payload: mockError("error")
            });
        expect(commit.mock.calls[3][0])
            .toStrictEqual({
                type: ADRMutation.SetFetchingDatasets,
                payload: false
            });
    });

    it("fetches schemas", async () => {
        mockAxios.onGet(`/adr/schemas/`)
            .reply(200, mockSuccess({baseUrl: "adr.com"}));

        const commit = jest.fn();

        await actions.getSchemas({commit, state, rootState} as any);

        expect(commit.mock.calls[0][0])
            .toEqual({
                type: ADRMutation.SetSchemas,
                payload: {baseUrl: "adr.com"}
            });
    });

    it("getUserCanUpload does nothing if no selected dataset", async () => {
        const commit = jest.fn();
        const root = mockRootState({
            baseline: mockBaselineState()
        });

        await actions.getUserCanUpload({commit, state, rootState: root} as any);

        expect(commit.mock.calls.length).toBe(0);
        expect(mockAxios.history.get.length).toBe(0);
    });

    it("getUserCanUpload fetches updateable dataset and commits when user can upload", async () => {
        const commit = jest.fn();
        const root = mockRootState({
            baseline: mockBaselineState({selectedDataset: {organization: {id: "test-org"}} as any})
        });
        const updateableOrgs = [{id: "other-org"}, {id: "test-org"}];
        mockAxios.onGet(`adr/orgs?permission=update_dataset`)
            .reply(200, mockSuccess(updateableOrgs));

        await actions.getUserCanUpload({commit, state, rootState: root} as any);

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]).toStrictEqual({type: "SetUserCanUpload", payload: true});
    });

    it("getUserCanUpload fetches updateable dataset and commits when user cannot upload", async () => {
        const commit = jest.fn();
        const root = mockRootState({
            baseline: mockBaselineState({selectedDataset: {organization: {id: "test-org"}} as any})
        });
        const updateableOrgs = [{id: "other-org"}, {id: "other-org-2"}];
        mockAxios.onGet(`adr/orgs?permission=update_dataset`)
            .reply(200, mockSuccess(updateableOrgs));

        await actions.getUserCanUpload({commit, state, rootState: root} as any);

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0]).toStrictEqual({type: "SetUserCanUpload", payload: false});
    });

    it("getUserCanUpload commits error", async () => {
        const commit = jest.fn();
        const root = mockRootState({
            baseline: mockBaselineState({selectedDataset: {organization: {id: "test-org"}} as any})
        });
        mockAxios.onGet(`adr/orgs?permission=update_dataset`)
            .reply(500, mockFailure("test-error"));

        await actions.getUserCanUpload({commit, state, rootState: root} as any);
        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0].type).toBe("ADRError");
        expect(commit.mock.calls[0][0].payload).toStrictEqual(mockError("test-error"));
    });

    it("getUserCanUpload sets organisation on selectedDataset if necessary", async () => {
        const root = mockRootState({
            baseline: mockBaselineState({selectedDataset: {id: "test-dataset"}} as any)
        });
        const adr = mockADRState({
            datasets: [{id: "test-dataset", resources: [], organization: {id: "test-org"}}],
            schemas: {baseUrl: "http://test"} as any
        });

        //Give commit an implementation so it can really update the state on the SetDataset mutation to allow testing
        //of action which required that state change
        const commit = jest.fn().mockImplementation((mutation, payload) => {
            if (mutation === "baseline/SetDataset") {
                root.baseline.selectedDataset = payload
            }
        });

        mockAxios.onGet(`adr/orgs?permission=update_dataset`)
            .reply(200, mockSuccess([{id: "test-org"}]));

        await actions.getUserCanUpload({commit, state: adr, rootState: root} as any);

        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]).toBe("baseline/SetDataset");
        expect(commit.mock.calls[0][1].id).toBe("test-dataset");
        expect(commit.mock.calls[0][1].organization).toStrictEqual({id: "test-org"});
        expect(commit.mock.calls[0][2]).toStrictEqual({root: true});
        expect(commit.mock.calls[1][0]).toStrictEqual({type: "SetUserCanUpload", payload: true});
    });

    it("getUserCanUpload fetches dataset metadata to get organization if necessary", async () => {
        const commit = jest.fn().mockImplementation((mutation, payload) => {
            if (mutation === "baseline/SetDataset") {
                root.baseline.selectedDataset = payload
            }
        });
        const root = mockRootState({
            baseline: mockBaselineState({selectedDataset: {id: "test-dataset"}} as any)
        });
        const adr = mockADRState({
            datasets: [],
            schemas: {baseUrl: "http://test"} as any
        });

        const datasetResponse = {id: "test-dataset", resources: [], organization: {id: "test-org"}}
        mockAxios.onGet(`adr/datasets/test-dataset`)
            .reply(200, mockSuccess(datasetResponse));
        mockAxios.onGet(`adr/orgs?permission=update_dataset`)
            .reply(200, mockSuccess([{id: "test-org"}]));

        await actions.getUserCanUpload({commit, state: adr, rootState: root} as any);

        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]).toBe("baseline/SetDataset");
        expect(commit.mock.calls[0][1].id).toBe("test-dataset");
        expect(commit.mock.calls[0][1].organization).toStrictEqual({id: "test-org"});
        expect(commit.mock.calls[0][2]).toStrictEqual({root: true});
        expect(commit.mock.calls[1][0]).toStrictEqual({type: "SetUserCanUpload", payload: true});
    });

});
