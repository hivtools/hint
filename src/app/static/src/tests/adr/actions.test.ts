import {
    mockADRState,
    mockAxios,
    mockBaselineState,
    mockError,
    mockFailure,
    mockModelCalibrateState,
    mockProjectsState,
    mockRootState,
    mockSuccess, mockSurveyAndProgramState
} from "../mocks";
import {actions} from "../../app/store/adr/actions";
import {ADRMutation} from "../../app/store/adr/mutations";
import {UploadFile} from "../../app/types";
import {switches} from "../../app/featureSwitches";

describe("ADR actions", () => {
    const state = mockADRState();
    const rootState = mockRootState();

    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
        mockAxios.reset();
    });

    const oldADRPushInputsValue = switches.adrPushInputs;
    afterEach(() => {
        (console.log as jest.Mock).mockClear();
        switches.adrPushInputs = oldADRPushInputsValue;
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
                resourceName: "project1 Naomi Outputs",
                resourceId: null,
                lastModified: null,
                resourceUrl: null
            },
            outputSummary: {
                index: 1,
                displayName: "uploadFileOutputSummary",
                resourceType: "output-summary",
                resourceFilename: "project1_naomi_summary.html",
                resourceName: "project1 Naomi Summary",
                resourceId: "123",
                lastModified: "2021-03-02",
                resourceUrl: "http://test"
            }
        });
    });

    const testGetUploadFilesInputs = async (enableFeatureSwitch: boolean) => {
        switches.adrPushInputs = enableFeatureSwitch ? "true" : null;

        const commit = jest.fn();
        const datasetWithResources = {
            resources: [
                {
                    resource_type: "output-summary",
                    id: "123",
                    last_modified: "2021-03-01",
                    metadata_modified: "2021-03-02",
                    url: "http://test"
                },
                {
                    resource_type: "adr-shape",
                    id: "456",
                    last_modified: "2021-04-01",
                    metadata_modified: "2021-04-02",
                    url: "http://adr/test-shape",
                    name: "Naomi Input Shape file"
                },
                {
                    resource_type: "adr-art",
                    id: "789",
                    last_modified: "2021-04-03",
                    metadata_modified: "2021-04-04",
                    url: "http://adr/test-art",
                    name: "Naomi Input ART file"
                }
            ]
        };
        mockAxios.onGet(`/adr/datasets/test-dataset`)
            .reply(200, mockSuccess(datasetWithResources));

        const adrState = mockADRState({
            schemas: {
                outputZip: "output-zip",
                outputSummary: "output-summary",
                pjnz: "adr-pjnz",
                shape: "adr-shape",
                population: "adr-population",
                survey: "adr-survey",
                programme: "adr-art",
                anc: "adr-anc"
            } as any});

        const root = mockRootState({
            baseline: mockBaselineState({
                selectedDataset: {id: "test-dataset"},
                pjnz: {fromADR: true},
                shape: {fromADR: false, filename: "test-shape.geojson"},
                population: {fromADR: true}
            } as any),
            surveyAndProgram: mockSurveyAndProgramState({
                survey: {fromADR: true},
                program: {fromADR: false, filename: "test-program.csv"},
                anc: {fromADR: true}
            } as any),
            projects: mockProjectsState({currentProject: {name: "project1"} as any})
        });

        await actions.getUploadFiles({commit, state: adrState, rootState: root} as any);

        expect(commit.mock.calls[1][0].type).toBe("SetUploadFiles");

        let expectedUploadFiles: Record<string, UploadFile> = {
            outputZip: {
                index: 0,
                displayName: "uploadFileOutputZip",
                resourceType: "output-zip",
                resourceFilename: "project1_naomi_outputs.zip",
                resourceName: "project1 Naomi Outputs",
                resourceId: null,
                lastModified: null,
                resourceUrl: null
            },
            outputSummary: {
                index: 1,
                displayName: "uploadFileOutputSummary",
                resourceType: "output-summary",
                resourceFilename: "project1_naomi_summary.html",
                resourceName: "project1 Naomi Summary",
                resourceId: "123",
                lastModified: "2021-03-02",
                resourceUrl: "http://test"
            }
        };

        if (enableFeatureSwitch) {
            expectedUploadFiles = {
                ...expectedUploadFiles,
                shape: {
                    index: 2,
                    displayName: "shape",
                    resourceType: "adr-shape",
                    resourceFilename: "test-shape.geojson",
                    resourceName: "Naomi Input Shape file",
                    resourceId: "456",
                    lastModified: "2021-04-02",
                    resourceUrl: "http://adr/test-shape"
                },
                programme: {
                    index: 3,
                    displayName: "ART",
                    resourceType: "adr-art",
                    resourceFilename: "test-program.csv",
                    resourceName: "Naomi Input ART file",
                    resourceId: "789",
                    lastModified: "2021-04-04",
                    resourceUrl: "http://adr/test-art"
                }
            };
        }

        expect(commit.mock.calls[1][0].payload).toStrictEqual(expectedUploadFiles);
    };

    it("getUploadFiles includes non-ADR input files when adrPushInputs feature switch is on", async () => {
        await testGetUploadFilesInputs(true);
    });

    it("getUploadFiles does not include non-ADR input files when adrPushInputs feature switch is off", async () => {
        await testGetUploadFilesInputs(false);
    });

    it("getUploadFiles can include full set of non_ADR input files when adrPushInputs feature switch is on", async () => {
        switches.adrPushInputs =  "true";

        const commit = jest.fn();
        const datasetWithResources = {
            resources: [
                {
                    resource_type: "output-summary",
                    id: "123",
                    last_modified: "2021-03-01",
                    metadata_modified: "2021-03-02",
                    url: "http://test"
                },
                {
                    resource_type: "adr-pjnz",
                    id: "234",
                    last_modified: "2021-03-03",
                    metadata_modified: "2021-03-04",
                    url: "http://adr/test-pjnz",
                    name: "Naomi Input PJNZ file"
                },
                {
                    resource_type: "adr-shape",
                    id: "345",
                    last_modified: "2021-03-05",
                    metadata_modified: "2021-03-06",
                    url: "http://adr/test-shape",
                    name: "Naomi Input Shape file"
                },
                {
                    resource_type: "adr-population",
                    id: "456",
                    last_modified: "2021-03-07",
                    metadata_modified: "2021-03-08",
                    url: "http://adr/test-pop",
                    name: "Naomi Input Population file"
                },
                {
                    resource_type: "adr-survey",
                    id: "567",
                    last_modified: "2021-03-09",
                    metadata_modified: "2021-03-10",
                    url: "http://adr/test-survey",
                    name: "Naomi Input Survey file"
                },
                {
                    resource_type: "adr-art",
                    id: "678",
                    last_modified: "2021-03-11",
                    metadata_modified: "2021-03-12",
                    url: "http://adr/test-art",
                    name: "Naomi Input ART file"
                },
                {
                    resource_type: "adr-anc",
                    id: "789",
                    last_modified: "2021-03-13",
                    metadata_modified: "2021-03-14",
                    url: "http://adr/test-anc",
                    name: "Naomi Input ANC file"
                }
            ]
        };
        mockAxios.onGet(`/adr/datasets/test-dataset`)
            .reply(200, mockSuccess(datasetWithResources));

        const adrState = mockADRState({
            schemas: {
                outputZip: "output-zip",
                outputSummary: "output-summary",
                pjnz: "adr-pjnz",
                shape: "adr-shape",
                population: "adr-population",
                survey: "adr-survey",
                programme: "adr-art",
                anc: "adr-anc"
            } as any});

        const root = mockRootState({
            baseline: mockBaselineState({
                selectedDataset: {id: "test-dataset"},
                pjnz: {fromADR: false, filename: "test.pjnz"},
                shape: {fromADR: false, filename: "test-shape.geojson"},
                population: {fromADR: false, filename: "test-pop.csv"}
            } as any),
            surveyAndProgram: mockSurveyAndProgramState({
                survey: {fromADR: false, filename: "test-survey.csv"},
                program: {fromADR: false, filename: "test-program.csv"},
                anc: {fromADR: false, filename: "test-anc.csv"}
            } as any),
            projects: mockProjectsState({currentProject: {name: "project1"} as any})
        });

        await actions.getUploadFiles({commit, state: adrState, rootState: root} as any);

        expect(commit.mock.calls[1][0].type).toBe("SetUploadFiles");

        let expectedUploadFiles: Record<string, UploadFile> = {
            outputZip: {
                index: 0,
                displayName: "uploadFileOutputZip",
                resourceType: "output-zip",
                resourceFilename: "project1_naomi_outputs.zip",
                resourceName: "project1 Naomi Outputs",
                resourceId: null,
                lastModified: null,
                resourceUrl: null
            },
            outputSummary: {
                index: 1,
                displayName: "uploadFileOutputSummary",
                resourceType: "output-summary",
                resourceFilename: "project1_naomi_summary.html",
                resourceName: "project1 Naomi Summary",
                resourceId: "123",
                lastModified: "2021-03-02",
                resourceUrl: "http://test"
            },
            pjnz: {
                index: 2,
                displayName: "PJNZ",
                resourceType: "adr-pjnz",
                resourceFilename: "test.pjnz",
                resourceName: "Naomi Input PJNZ file",
                resourceId: "234",
                lastModified: "2021-03-04",
                resourceUrl: "http://adr/test-pjnz"
            },
            shape: {
                index: 3,
                displayName: "shape",
                resourceType: "adr-shape",
                resourceFilename: "test-shape.geojson",
                resourceName: "Naomi Input Shape file",
                resourceId: "345",
                lastModified: "2021-03-06",
                resourceUrl: "http://adr/test-shape"
            },
            population: {
                index: 4,
                displayName: "population",
                resourceType: "adr-population",
                resourceFilename: "test-pop.csv",
                resourceName: "Naomi Input Population file",
                resourceId: "456",
                lastModified: "2021-03-08",
                resourceUrl: "http://adr/test-pop"
            },
            survey: {
                index: 5,
                displayName: "survey",
                resourceType: "adr-survey",
                resourceFilename: "test-survey.csv",
                resourceName: "Naomi Input Survey file",
                resourceId: "567",
                lastModified: "2021-03-10",
                resourceUrl: "http://adr/test-survey"
            },
            programme: {
                index: 6,
                displayName: "ART",
                resourceType: "adr-art",
                resourceFilename: "test-program.csv",
                resourceName: "Naomi Input ART file",
                resourceId: "678",
                lastModified: "2021-03-12",
                resourceUrl: "http://adr/test-art"
            },
            anc: {
                index: 7,
                displayName: "ANC",
                resourceType: "adr-anc",
                resourceFilename: "test-anc.csv",
                resourceName: "Naomi Input ANC file",
                resourceId: "789",
                lastModified: "2021-03-14",
                resourceUrl: "http://adr/test-anc"
            }
        };

        expect(commit.mock.calls[1][0].payload).toStrictEqual(expectedUploadFiles);
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
        mockAxios.onPost(`adr/datasets/datasetId/resource/type1/calId`)
            .reply(200, mockSuccess(success));
        mockAxios.onPost(`adr/datasets/datasetId/resource/type2/calId`)
            .reply(200, mockSuccess(success2));

        await actions.uploadFilestoADR({commit, state: adr, rootState: root} as any, uploadFilesPayload);

        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]["type"]).toBe("ADRUploadStarted");
        expect(commit.mock.calls[1][0]["payload"]).toEqual(success2);
        expect(commit.mock.calls[1][0]["type"]).toBe("ADRUploadCompleted");
        expect(mockAxios.history.post.length).toBe(2);
        expect(mockAxios.history.post[0]["data"]).toBe("resourceFileName=file1&resourceId=id1");
        expect(mockAxios.history.post[0]["url"]).toBe("/adr/datasets/datasetId/resource/type1/calId");
        expect(mockAxios.history.post[1]["data"]).toBe("resourceFileName=file2");
        expect(mockAxios.history.post[1]["url"]).toBe("/adr/datasets/datasetId/resource/type2/calId");
    });

    it("uploadFilestoADR sets upload failure and prevents subsquent uploads", async () => {
        const commit = jest.fn();
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

        await actions.uploadFilestoADR({commit, state: adr, rootState: root} as any, uploadFilesPayload);

        expect(commit.mock.calls.length).toBe(2);
        expect(commit.mock.calls[0][0]["type"]).toBe("ADRUploadStarted");
        expect(commit.mock.calls[1][0]["payload"]).toEqual({"detail": "failed", "error": "OTHER_ERROR"});
        expect(commit.mock.calls[1][0]["type"]).toBe("SetADRUploadError");
        expect(mockAxios.history.post.length).toBe(1);
        expect(mockAxios.history.post[0]["data"]).toBe("resourceFileName=file1&resourceId=id1");
        expect(mockAxios.history.post[0]["url"]).toBe("/adr/datasets/datasetId/resource/type1/calId");
    });
});
