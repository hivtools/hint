import {
    mockADRState,
    mockAxios,
    mockBaselineState,
    mockError,
    mockFailure,
    mockModelCalibrateState,
    mockProjectsState,
    mockRootState,
    mockSuccess
} from "../mocks";
import {actions} from "../../app/store/adr/actions";
import {ADRMutation} from "../../app/store/adr/mutations";
import {UploadFile} from "../../app/types";

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

    it("getUploadFiles does nothing if no selected dataset", async () => {
        const commit = jest.fn();
        const root = mockRootState({
            baseline: mockBaselineState(),
            projects: mockProjectsState({currentProject: {id: 1} as any})
        });

        await actions.getUploadFiles({commit, state, rootState: root} as any);

        expect(commit.mock.calls.length).toBe(0);
        expect(mockAxios.history.get.length).toBe(0);
    });

    it("getUploadFiles does nothing if no current project", async () => {
        const commit = jest.fn();
        const root = mockRootState({
            baseline: mockBaselineState({selectedDataset: {id: 1} as any}),
            projects: mockProjectsState()
        });

        await actions.getUploadFiles({commit, state, rootState: root} as any);

        expect(commit.mock.calls.length).toBe(0);
        expect(mockAxios.history.get.length).toBe(0);
    });

    it("getUploadFiles commits error on error response", async () => {
        const commit = jest.fn();

        mockAxios.onGet(`/adr/datasets/test-dataset`)
            .reply(500, mockFailure("test error"));

        const root = mockRootState({
            baseline: mockBaselineState({selectedDataset: {id: "test-dataset"} as any}),
            projects: mockProjectsState({currentProject: {name: "project1"} as any})
        });

        await actions.getUploadFiles({commit, state, rootState: root} as any);

        expect(commit.mock.calls[0][0].type).toBe("ADRError");
        expect(commit.mock.calls[0][0].payload).toBeNull();

        expect(commit.mock.calls[1][0].type).toBe("ADRError");
        expect(commit.mock.calls[1][0].payload).toStrictEqual(mockError("test error"));
    });

    it("getUploadFiles gets dataset details and constructs upload files", async () => {
        const commit = jest.fn();
        const datasetWithResources = {
            resources: [
                {
                    resource_type: "output-summary",
                    id: "123",
                    last_modified: "2021-03-01",
                    metadata_modified: "2021-03-02",
                    url: "http://test"
                }
            ]
        };
        mockAxios.onGet(`/adr/datasets/test-dataset`)
            .reply(200, mockSuccess(datasetWithResources));

        const adrState = mockADRState({schemas: {outputZip: "output-zip", outputSummary: "output-summary"} as any});
        const root = mockRootState({
            baseline: mockBaselineState({selectedDataset: {id: "test-dataset"} as any}),
            projects: mockProjectsState({currentProject: {name: "project1"} as any})
        });

        await actions.getUploadFiles({commit, state: adrState, rootState: root} as any);

        expect(commit.mock.calls[0][0].type).toBe("ADRError");
        expect(commit.mock.calls[0][0].payload).toBeNull();

        expect(commit.mock.calls[1][0].type).toBe("SetUploadFiles");
        expect(commit.mock.calls[1][0].payload).toStrictEqual({
            outputZip: {
                index: 0,
                displayName: "uploadFileOutputZip",
                resourceType: "output-zip",
                resourceFilename: "project1_naomi_outputs.zip",
                resourceId: null,
                lastModified: null,
                resourceUrl: null
            },
            outputSummary: {
                index: 1,
                displayName: "uploadFileOutputSummary",
                resourceType: "output-summary",
                resourceFilename: "project1_naomi_summary.html",
                resourceId: "123",
                lastModified: "2021-03-02",
                resourceUrl: "http://test"
            }
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
        const commit = jest.fn();
        const root = mockRootState({
            baseline: mockBaselineState({selectedDataset: {id: "test-dataset"}} as any)
        });
        const adr = mockADRState({
            datasets: [{id: "test-dataset", resources: [], organization: {id: "test-org"}}],
            schemas: {baseUrl: "http://test"} as any
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
        const commit = jest.fn();
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

    it("uploadFilestoADR uploads files sequentially to adr and commits complete on upload of final file", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calId"}),
            baseline: mockBaselineState({selectedDataset: {
                id: "datasetId"
            }} as any)
        });
        const adr = mockADRState({
            datasets: [],
            schemas: {baseUrl: "http://test"} as any
        });

        const uploadFilesPayload = [
                {
                    resourceType: "type1",
                    resourceFilename: "file1",
                    resourceId: "id1"
                },
                {
                    resourceType: "type2",
                    resourceFilename: "file2"
                }
            ] as UploadFile[]

        const success = {response: "success"}
        const success2 = {response: "success2"}
        const success3 = {response: "success3", data: {id: "datasetId"}}
        mockAxios.onPost(`adr/datasets/datasetId/resource/type1/calId`)
            .reply(200, mockSuccess(success));
        mockAxios.onPost(`adr/datasets/datasetId/resource/type2/calId`)
            .reply(200, mockSuccess(success2));
        mockAxios.onGet(`adr/datasets/datasetId`)
            .reply(200, mockSuccess(success3));

        await actions.uploadFilestoADR({commit, dispatch, state: adr, rootState: root} as any, uploadFilesPayload);

        expect(commit.mock.calls.length).toBe(5);
        expect(commit.mock.calls[0][0]["type"]).toBe("ADRUploadStarted");
        expect(commit.mock.calls[0][0]["payload"]).toBe(2);
        expect(commit.mock.calls[1][0]["type"]).toBe("ADRUploadProgress");
        expect(commit.mock.calls[1][0]["payload"]).toBe(1);
        expect(commit.mock.calls[2][0]["type"]).toBe("ADRUploadProgress");
        expect(commit.mock.calls[2][0]["payload"]).toBe(2);
        expect(commit.mock.calls[3][0]["type"]).toBe("ADRUploadCompleted");
        expect(commit.mock.calls[3][0]["payload"]).toEqual(success2);
        expect(commit.mock.calls[4][0]).toBe("baseline/SetDataset");
        expect(commit.mock.calls[4][2]["root"]).toBe(true);
        expect(dispatch.mock.calls.length).toBe(1);
        expect(dispatch.mock.calls[0][0]).toBe("getUploadFiles");
        expect(mockAxios.history.post.length).toBe(2);
        expect(mockAxios.history.post[0]["data"]).toBe("resourceFileName=file1&resourceId=id1");
        expect(mockAxios.history.post[0]["url"]).toBe("/adr/datasets/datasetId/resource/type1/calId");
        expect(mockAxios.history.post[1]["data"]).toBe("resourceFileName=file2");
        expect(mockAxios.history.post[1]["url"]).toBe("/adr/datasets/datasetId/resource/type2/calId");
        expect(mockAxios.history.get.length).toBe(1);
        expect(mockAxios.history.get[0]["url"]).toBe("/adr/datasets/datasetId");
    });

    it("uploadFilestoADR sets upload failure and prevents subsquent uploads", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const root = mockRootState({
            modelCalibrate: mockModelCalibrateState({calibrateId: "calId"}),
            baseline: mockBaselineState({selectedDataset: {
                id: "datasetId"
            }} as any)
        });
        const adr = mockADRState({
            datasets: [],
            schemas: {baseUrl: "http://test"} as any
        });

        const uploadFilesPayload = [
            {
                resourceType: "type1",
                resourceFilename: "file1",
                resourceId: "id1"
            },
            {
                resourceType: "type2",
                resourceFilename: "file2",
                resourceId: "id2"
            }
        ] as UploadFile[]


        const success2 = {response: "success2"}

        mockAxios.onPost(`adr/datasets/datasetId/resource/type1/calId`)
            .reply(500, mockFailure("failed"));
        mockAxios.onPost(`adr/datasets/datasetId/resource/type2/calId`)
            .reply(200, mockSuccess(success2));

        await actions.uploadFilestoADR({commit, dispatch, state: adr, rootState: root} as any, uploadFilesPayload);

        expect(commit.mock.calls.length).toBe(4);
        expect(commit.mock.calls[0][0]["type"]).toBe("ADRUploadStarted");
        expect(commit.mock.calls[0][0]["payload"]).toBe(2);
        expect(commit.mock.calls[1][0]["type"]).toBe("ADRUploadProgress");
        expect(commit.mock.calls[1][0]["payload"]).toBe(1);
        expect(commit.mock.calls[2][0]["type"]).toBe("SetADRUploadError");
        expect(commit.mock.calls[2][0]["payload"]).toEqual({"detail": "failed", "error": "OTHER_ERROR"});
        expect(commit.mock.calls[3][0]).toBe("baseline/SetDataset");
        expect(commit.mock.calls[3][2]["root"]).toBe(true);
        expect(dispatch.mock.calls.length).toBe(1);
        expect(dispatch.mock.calls[0][0]).toBe("getUploadFiles");
        expect(mockAxios.history.post.length).toBe(1);
        expect(mockAxios.history.post[0]["data"]).toBe("resourceFileName=file1&resourceId=id1");
        expect(mockAxios.history.post[0]["url"]).toBe("/adr/datasets/datasetId/resource/type1/calId");
        expect(mockAxios.history.get.length).toBe(1);
        expect(mockAxios.history.get[0]["url"]).toBe("/adr/datasets/datasetId");
    });
});
