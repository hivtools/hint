import {
    mockADRState,
    mockAxios,
    mockBaselineState,
    mockCalibrateResultResponse,
    mockError,
    mockFailure,
    mockModelCalibrateState,
    mockModelRunState,
    mockProjectsState,
    mockRootState,
    mockSuccess
} from "../mocks";
import {actions} from "../../app/store/adrUpload/actions";
import {UploadFile} from "../../app/types";

describe("ADR actions", () => {
    const state = mockADRState();

    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
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

        expect(commit.mock.calls[0][0].type).toBe("SetADRUploadError");
        expect(commit.mock.calls[0][0].payload).toBeNull();

        expect(commit.mock.calls[1][0].type).toBe("SetADRUploadError");
        expect(commit.mock.calls[1][0].payload).toStrictEqual(mockError("test error"));
    });

    it("getUploadFiles gets dataset details and constructs upload files", async () => {
        const commit = jest.fn();
        const datasetWithResources = {
            resources: [
                {
                    resource_type: "output-summary",
                    id: "456",
                    name: "project2_naomi_summary.html",
                    last_modified: "2021-03-01",
                    metadata_modified: "2021-03-02",
                    url: "http://test2"
                },
                {
                    resource_type: "output-summary",
                    id: "123",
                    name: "project1_naomi_summary.html",
                    last_modified: "2021-03-01",
                    metadata_modified: "2021-03-02",
                    url: "http://test"
                }
            ]
        };
        mockAxios.onGet(`/adr/datasets/test-dataset`)
            .reply(200, mockSuccess(datasetWithResources));

        const root = mockRootState({
            adr: mockADRState({schemas: {outputZip: "output-zip", outputSummary: "output-summary"} as any}),
            baseline: mockBaselineState({selectedDataset: {id: "test-dataset"} as any}),
            projects: mockProjectsState({currentProject: {name: "project1"} as any})
        });

        await actions.getUploadFiles({commit, rootState: root} as any);

        expect(commit.mock.calls[0][0].type).toBe("SetADRUploadError");
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

    it("uploadFilesToADR uploads files sequentially to adr and commits complete on upload of final file", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const root = mockRootState({
            adr: mockADRState({
                datasets: [],
                schemas: {
                    baseUrl: "http://test",
                    outputZip: "inputs-unaids-naomi-output-zip",
                    outputSummary: "inputs-unaids-naomi-report"
                } as any
            }),
            modelCalibrate: mockModelCalibrateState({calibrateId: "calId"}),
            modelRun: mockModelRunState(
                {
                    result: mockCalibrateResultResponse({
                        uploadMetadata: {
                            outputSummary: {description: "summary"},
                            outputZip: {description: "zip"}
                        }
                    })
                }),
            baseline: mockBaselineState({
                selectedDataset: {
                    id: "datasetId"
                }
            } as any)
        });

        const uploadFilesPayload = [
            {
                resourceType: "inputs-unaids-naomi-output-zip",
                resourceFilename: "file1",
                resourceId: "id1"
            },
            {
                resourceType: "inputs-unaids-naomi-report",
                resourceFilename: "file2"
            }
        ] as UploadFile[]

        const success = {response: "success"}
        const success2 = {response: "success2"}
        const success3 = {response: "success3", data: {id: "datasetId"}}

        mockAxios.onPost(`adr/datasets/datasetId/resource/inputs-unaids-naomi-output-zip/calId`)
            .reply(200, mockSuccess(success));
        mockAxios.onPost(`adr/datasets/datasetId/resource/inputs-unaids-naomi-report/calId`)
            .reply(200, mockSuccess(success2));
        mockAxios.onGet(`adr/datasets/datasetId`)
            .reply(200, mockSuccess(success3));

        await actions.uploadFilesToADR({commit, dispatch, rootState: root} as any, uploadFilesPayload);

        expect(commit.mock.calls.length).toBe(4);
        expect(commit.mock.calls[0][0]["type"]).toBe("ADRUploadStarted");
        expect(commit.mock.calls[0][0]["payload"]).toBe(2);
        expect(commit.mock.calls[1][0]["type"]).toBe("ADRUploadProgress");
        expect(commit.mock.calls[1][0]["payload"]).toBe(1);
        expect(commit.mock.calls[2][0]["type"]).toBe("ADRUploadProgress");
        expect(commit.mock.calls[2][0]["payload"]).toBe(2);
        expect(commit.mock.calls[3][0]["type"]).toBe("ADRUploadCompleted");
        expect(commit.mock.calls[3][0]["payload"]).toEqual(success2);
        expect(dispatch.mock.calls.length).toBe(2);
        expect(dispatch.mock.calls[0][0]).toBe("adr/getAndSetDatasets");
        expect(dispatch.mock.calls[1][0]).toBe("getUploadFiles");
        expect(mockAxios.history.post.length).toBe(2);
        expect(mockAxios.history.post[0]["data"]).toBe("resourceFileName=file1&resourceId=id1&description=zip");
        expect(mockAxios.history.post[0]["url"]).toBe("/adr/datasets/datasetId/resource/inputs-unaids-naomi-output-zip/calId");
        expect(mockAxios.history.post[1]["data"]).toBe("resourceFileName=file2&description=summary");
        expect(mockAxios.history.post[1]["url"]).toBe("/adr/datasets/datasetId/resource/inputs-unaids-naomi-report/calId");
    });

    it("uploadFilesToADR sets upload failure and prevents subsequent uploads", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const root = mockRootState({
            adr: mockADRState({
                datasets: [],
                schemas: {
                    baseUrl: "http://test",
                    outputZip: "inputs-unaids-naomi-output-zip",
                    outputSummary: "inputs-unaids-naomi-report"
                } as any
            }),
            modelCalibrate: mockModelCalibrateState({calibrateId: "calId"}),
            modelRun: mockModelRunState(
                {
                    result: mockCalibrateResultResponse({
                        uploadMetadata: {
                            outputSummary: {description: "summary"},
                            outputZip: {description: "zip"}
                        }
                    })
                }),
            baseline: mockBaselineState({
                selectedDataset: {
                    id: "datasetId"
                }
            } as any)
        });

        const uploadFilesPayload = [
            {
                resourceType: "inputs-unaids-naomi-report",
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

        mockAxios.onPost(`adr/datasets/datasetId/resource/inputs-unaids-naomi-report/calId`)
            .reply(500, mockFailure("failed"));
        mockAxios.onPost(`adr/datasets/datasetId/resource/type2/calId`)
            .reply(200, mockSuccess(success2));

        await actions.uploadFilesToADR({commit, dispatch, rootState: root} as any, uploadFilesPayload);

        expect(commit.mock.calls.length).toBe(3);
        expect(commit.mock.calls[0][0]["type"]).toBe("ADRUploadStarted");
        expect(commit.mock.calls[0][0]["payload"]).toBe(2);
        expect(commit.mock.calls[1][0]["type"]).toBe("ADRUploadProgress");
        expect(commit.mock.calls[1][0]["payload"]).toBe(1);
        expect(commit.mock.calls[2][0]["type"]).toBe("SetADRUploadError");
        expect(commit.mock.calls[2][0]["payload"]).toEqual({"detail": "failed", "error": "OTHER_ERROR"});
        expect(dispatch.mock.calls.length).toBe(2);
        expect(dispatch.mock.calls[0][0]).toBe("adr/getAndSetDatasets");
        expect(dispatch.mock.calls[1][0]).toBe("getUploadFiles");
        expect(mockAxios.history.post.length).toBe(1);
        expect(mockAxios.history.post[0]["data"]).toBe("resourceFileName=file1&resourceId=id1&description=summary");
        expect(mockAxios.history.post[0]["url"]).toBe("/adr/datasets/datasetId/resource/inputs-unaids-naomi-report/calId");
    });

    it("uploadFilesToADR uploads files and static description sequentially to adr", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const root = mockRootState({
            adr: mockADRState({
                datasets: [],
                schemas: {
                    baseUrl: "http://test",
                    outputZip: "inputs-unaids-naomi-output-zip",
                    outputSummary: "inputs-unaids-naomi-report"
                } as any
            }),
            modelCalibrate: mockModelCalibrateState({calibrateId: "calId"}),
            modelRun: mockModelRunState({}),
            baseline: mockBaselineState({
                selectedDataset: {
                    id: "datasetId"
                }
            } as any)
        });

        const uploadFilesPayload = [
            {
                resourceType: "inputs-unaids-naomi-output-zip",
                resourceFilename: "file1",
                resourceId: "id1"
            },
            {
                resourceType: "inputs-unaids-naomi-report",
                resourceFilename: "file2"
            }
        ] as UploadFile[]

        mockAxios.onPost(`adr/datasets/datasetId/resource/inputs-unaids-naomi-output-zip/calId`)
            .reply(200, mockSuccess("success"));
        mockAxios.onPost(`adr/datasets/datasetId/resource/inputs-unaids-naomi-report/calId`)
            .reply(200, mockSuccess("success2"));

        await actions.uploadFilesToADR({commit, dispatch, rootState: root} as any, uploadFilesPayload);
        expect(mockAxios.history.post.length).toBe(2);
        expect(mockAxios.history.post[0]["data"]).toBe("resourceFileName=file1&resourceId=id1&description=Naomi%20output%20uploaded%20from%20Naomi%20web%20app");
        expect(mockAxios.history.post[0]["url"]).toBe("/adr/datasets/datasetId/resource/inputs-unaids-naomi-output-zip/calId");
        expect(mockAxios.history.post[1]["data"]).toBe("resourceFileName=file2&description=Naomi%20summary%20report%20uploaded%20from%20Naomi%20web%20app");
        expect(mockAxios.history.post[1]["url"]).toBe("/adr/datasets/datasetId/resource/inputs-unaids-naomi-report/calId");
    });
});
