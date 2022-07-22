import {
    mockAxios, mockCalibrateResultResponse,
    mockError,
    mockFailure,
    mockLoadState, mockModelCalibrateState,
    mockOptionsFormMeta,
    mockRootState,
    mockSuccess
} from "../mocks";
import {actions} from "../../app/store/load/actions";
import {LoadingState} from "../../app/store/load/load";
import {addCheckSum} from "../../app/utils";
import {localStorageManager} from "../../app/localStorageManager";
import {currentHintVersion} from "../../app/hintVersion";
import {ProjectRehydrateStatusResponse} from "../../app/generated";
import {DynamicControlType} from "@reside-ic/vue-dynamic-form";
import {RootState} from "../../app/root";

const rootState = mockRootState();

describe("Load actions", () => {

    beforeEach(() => {
        mockAxios.reset();
        // stop apiService logging to console
        console.log = jest.fn();
        console.info = jest.fn();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
        (console.info as jest.Mock).mockClear();
    });

    const rehydrateResultResponse = {
        state: {
            datasets: {
                pjnz: {
                    path: "uploads/test.csv",
                    filename: "test"
                },
                population: {
                    path: "uploads/test.csv",
                    filename: "test"
                },
                shape: {
                    path: "uploads/test.csv",
                    filename: "test"
                },
                anc: {
                    path: "uploads/test.csv",
                    filename: "test"
                },
                survey: {
                    path: "uploads/test.csv",
                    filename: "test"
                },
                programme: {
                    path: "uploads/test.csv",
                    filename: "test"
                }
            },
            calibrate: {
                id: "123",
                options: {}
            },
            model_fit: {
                id: "1",
                options: {}
            }
        }
    }

    const RunningStatusResponse: ProjectRehydrateStatusResponse = {
        id: "db0c4957aea4b32c507ac02d63930110",
        done: true,
        progress: ["Generating summary report"],
        status: "COMPLETE",
        success: true,
        queue: 0
    }

    it("load reads blob and dispatches setFiles action", (done) => {
        const dispatch = jest.fn();
        const file = new File(["Test File Contents"], "testFile")
        actions.load({dispatch, rootState} as any, file);

        const interval = setInterval(() => {
            if (dispatch.mock.calls.length > 0) {
                expect(dispatch.mock.calls[0][0]).toEqual("setFiles");
                expect(dispatch.mock.calls[0][1].savedFileContents).toEqual("Test File Contents");
                clearInterval(interval);
                done();
            }
        });
    });

    it("clears loading state", async () => {
        const commit = jest.fn();
        await actions.clearLoadState({commit, rootState} as any);
        expect(commit.mock.calls[0][0]).toStrictEqual({type: "LoadStateCleared", payload: null});
    });

    it("loadVersion sets files and updates store state", async (done) => {
        mockAxios.onPost(`/session/files/`)
            .reply(200, mockSuccess({}));
        const commit = jest.fn();
        const dispatch = jest.fn();
        const state = mockLoadState({loadingState: LoadingState.UpdatingState});

        await actions.loadFromVersion({commit, dispatch, state, rootState} as any, {
            files: "files",
            state: JSON.stringify({stepper: {}})
        });
        setTimeout(() => {
            expect(commit.mock.calls[0][0]).toStrictEqual({type: "SettingFiles", payload: null});
            expect(commit.mock.calls[1][0]).toStrictEqual({type: "UpdatingState", payload: {}});

            expect(mockAxios.history.post[0].url).toBe("/session/files/");
            expect(mockAxios.history.post[0].data).toBe("files");

            expect(dispatch.mock.calls[0][0]).toBe("updateStoreState");
            expect(dispatch.mock.calls[0][1]).toStrictEqual({
                stepper: {
                    steps: [
                        {
                            "number": 1,
                            "textKey": "uploadInputs"
                        },
                        {
                            "number": 2,
                            "textKey": "reviewInputs"
                        },
                        {
                            "number": 3,
                            "textKey": "modelOptions"
                        },
                        {
                            "number": 4,
                            "textKey": "fitModel"
                        },
                        {
                            "number": 5,
                            "textKey": "calibrateModel"
                        },
                        {
                            "number": 6,
                            "textKey": "reviewOutput"
                        },
                        {
                            "number": 7,
                            "textKey": "downloadResults"
                        }
                    ]
                }
            });
            done();
        });
    });

    it("updates store state after successful setFiles post", async () => {

        mockAxios.onPost(`/session/files/`)
            .reply(200, mockSuccess({}));

        const commit = jest.fn();
        const state = mockLoadState({loadingState: LoadingState.UpdatingState});
        const dispatch = jest.fn();
        const rootGetters = {isGuest: true};
        const fileContents = addCheckSum(JSON.stringify({files: "TEST FILES", state: {"version": currentHintVersion, stepper: {}}}));
        await actions.setFiles({commit, state, dispatch, rootState, rootGetters} as any,
            {savedFileContents: fileContents}
        );

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "SettingFiles", payload: null});
        expect(commit.mock.calls[1][0]).toStrictEqual({type: "UpdatingState", payload: {}});

        //should also hand on to updateState action
        expect(dispatch.mock.calls[0][0]).toEqual("updateStoreState");
        expect(dispatch.mock.calls[0][1]).toStrictEqual({
            stepper: {
                steps: [
                    {
                        "number": 1,
                        "textKey": "uploadInputs"
                    },
                    {
                        "number": 2,
                        "textKey": "reviewInputs"
                    },
                    {
                        "number": 3,
                        "textKey": "modelOptions"
                    },
                    {
                        "number": 4,
                        "textKey": "fitModel"
                    },
                    {
                        "number": 5,
                        "textKey": "calibrateModel"
                    },
                    {
                        "number": 6,
                        "textKey": "reviewOutput"
                    },
                    {
                        "number": 7,
                        "textKey": "downloadResults"
                    }
                ]
            },
            "version": currentHintVersion
        });
    });

    it("if not guest, creates project and updates saved State before setting files", async () => {
        mockAxios.onPost(`/session/files/`)
            .reply(200, mockSuccess({}));

        const commit = jest.fn();
        const state = mockLoadState({loadingState: LoadingState.UpdatingState, projectName: "new project"});
        const dispatch = jest.fn();
        const testRootState = {
            version: currentHintVersion,
            projects: {
                currentProject: "TEST PROJECT",
                currentVersion: "TEST VERSION"
            }
        };
        const rootGetters = {isGuest: false};
        const fileContents = addCheckSum(JSON.stringify({
            files: "TEST FILES",
            state: {version: currentHintVersion, projects: {}, stepper: {}}
        }));

        await actions.setFiles({commit, state, dispatch, rootState: testRootState, rootGetters} as any,
            {savedFileContents: fileContents}
        );

        expect(dispatch.mock.calls[0][0]).toEqual("projects/createProject");
        expect(dispatch.mock.calls[0][1]).toEqual({name: "new project"});
        expect(dispatch.mock.calls[0][2]).toStrictEqual({root: true});

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "SettingFiles", payload: null});
        expect(commit.mock.calls[1][0]).toStrictEqual({type: "UpdatingState", payload: {}});

        //should also hand on to updateState action, with updated project state
        expect(dispatch.mock.calls[1][0]).toEqual("updateStoreState");
        expect(dispatch.mock.calls[1][1]).toStrictEqual(
            {
                version: currentHintVersion,
                projects: {
                    currentProject: "TEST PROJECT",
                    currentVersion: "TEST VERSION"
                },
                stepper: {
                    steps: [
                        {
                            "number": 1,
                            "textKey": "uploadInputs"
                        },
                        {
                            "number": 2,
                            "textKey": "reviewInputs"
                        },
                        {
                            "number": 3,
                            "textKey": "modelOptions"
                        },
                        {
                            "number": 4,
                            "textKey": "fitModel"
                        },
                        {
                            "number": 5,
                            "textKey": "calibrateModel"
                        },
                        {
                            "number": 6,
                            "textKey": "reviewOutput"
                        },
                        {
                            "number": 7,
                            "textKey": "downloadResults"
                        }
                    ]
                }
            });
    });

    it("calls loadFailed mutation with invalid checksum", async () => {

        mockAxios.onPost(`/session/files/`)
            .reply(400, mockFailure("Test error"));

        const commit = jest.fn();
        const state = mockLoadState({loadingState: LoadingState.NotLoading});
        const dispatch = jest.fn();
        const fileContents = '["badchecksum", {"files": "TEST FILES", "state": "TEST STATE"}]';
        await actions.setFiles({commit, state, dispatch, rootState} as any,
            {savedFileContents: fileContents}
        );

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "SettingFiles", payload: null});
        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: "LoadFailed",
            payload: {detail: "The file contents are corrupted."}
        });

        //should not hand on to updateState action
        expect(dispatch.mock.calls.length).toEqual(0);
    });

    it("calls loadFailed mutation after unsuccessful setFiles post", async () => {

        mockAxios.onPost(`/session/files/`)
            .reply(400, mockFailure("Test error"));

        const commit = jest.fn();
        const state = mockLoadState({loadingState: LoadingState.LoadFailed});
        const dispatch = jest.fn();
        const rootGetters = {isGuest: true};
        const fileContents = addCheckSum(JSON.stringify({files: "TEST FILES", state: {version: currentHintVersion, stepper: {}}}));
        await actions.setFiles({commit, state, dispatch, rootState, rootGetters} as any,
            {savedFileContents: fileContents}
        );

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "SettingFiles", payload: null});
        expect(commit.mock.calls[1][0]).toStrictEqual({type: "LoadFailed", payload: mockError("Test error")});

        //should not hand on to updateState action
        expect(dispatch.mock.calls.length).toEqual(0);
    });

    it("calls loadFailed mutation when loaded state's version is not current", async () => {
        mockAxios.onPost(`/session/files/`)
            .reply(200, mockSuccess({}));

        const commit = jest.fn();
        const state = mockLoadState({loadingState: LoadingState.UpdatingState});
        const dispatch = jest.fn();
        const rootGetters = {isGuest: true};
        const fileContents = addCheckSum(JSON.stringify({files: "TEST FILES", state: {"version": "0.0.0"}}));
        await actions.setFiles({commit, state, dispatch, rootState, rootGetters} as any,
            {savedFileContents: fileContents}
        );

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "SettingFiles", payload: null});
        expect(commit.mock.calls[1][0].type).toStrictEqual("LoadFailed");
        expect(commit.mock.calls[1][0].payload).toStrictEqual({detail: "Unable to load file created by older version of the application."});

        //should not hand on to updateState action
        expect(dispatch.mock.calls.length).toEqual(0);
    });

    it("calls loadFailed mutation when loaded state does not contain a version", async () => {
        mockAxios.onPost(`/session/files/`)
            .reply(200, mockSuccess({}));

        const commit = jest.fn();
        const state = mockLoadState({loadingState: LoadingState.UpdatingState});
        const dispatch = jest.fn();
        const rootGetters = {isGuest: true};
        const fileContents = addCheckSum(JSON.stringify({files: "TEST FILES", state: {}}));
        await actions.setFiles({commit, state, dispatch, rootState, rootGetters} as any,
            {savedFileContents: fileContents}
        );

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "SettingFiles", payload: null});
        expect(commit.mock.calls[1][0].type).toStrictEqual("LoadFailed");
        expect(commit.mock.calls[1][0].payload).toStrictEqual({detail: "Unable to load file created by older version of the application."});

        //should not hand on to updateState action
        expect(dispatch.mock.calls.length).toEqual(0);
    });

    it("can load file when state differs by minor version", async () => {

        mockAxios.onPost(`/session/files/`)
            .reply(200, mockSuccess({}));

        const commit = jest.fn();
        const state = mockLoadState({loadingState: LoadingState.UpdatingState});
        const dispatch = jest.fn();
        const rootGetters = {isGuest: true};
        const fileContents = addCheckSum(JSON.stringify({
            files: "TEST FILES",
            state: {"version": "2.1.0", stepper: {}}
        }));
        await actions.setFiles({commit, state, dispatch, rootState, rootGetters} as any,
            {savedFileContents: fileContents}
        );

        expect(commit.mock.calls[0][0]).toStrictEqual({type: "SettingFiles", payload: null});
        expect(commit.mock.calls[1][0]).toStrictEqual({type: "UpdatingState", payload: {}});
        expect(dispatch.mock.calls[0][0]).toEqual("updateStoreState");
        expect(dispatch.mock.calls[0][1]).toStrictEqual({
            stepper: {
                steps: [
                    {
                        "number": 1,
                        "textKey": "uploadInputs"
                    },
                    {
                        "number": 2,
                        "textKey": "reviewInputs"
                    },
                    {
                        "number": 3,
                        "textKey": "modelOptions"
                    },
                    {
                        "number": 4,
                        "textKey": "fitModel"
                    },
                    {
                        "number": 5,
                        "textKey": "calibrateModel"
                    },
                    {
                        "number": 6,
                        "textKey": "reviewOutput"
                    },
                    {
                        "number": 7,
                        "textKey": "downloadResults"
                    }
                ]
            },
            "version": "2.1.0"
        });
    });


    it("updateStoreState saves file state to local storage and reloads page", async () => {
        const mockSaveToLocalStorage = jest.fn();
        localStorageManager.savePartialState = mockSaveToLocalStorage;

        const mockLocationReload = jest.fn();
        delete window.location;
        window.location = {reload: mockLocationReload} as any;

        const testState = mockRootState();
        await actions.updateStoreState({rootState} as any, testState);

        expect(mockSaveToLocalStorage.mock.calls[0][0]).toStrictEqual(testState);
        expect(mockLocationReload.mock.calls.length).toBe(1);
    });

    it("extracts calibrate options from dynamicFormMeta and saves and loads file state", async () => {
        const mockSaveToLocalStorage = jest.fn();
        localStorageManager.savePartialState = mockSaveToLocalStorage;

        const mockLocationReload = jest.fn();
        delete window.location;
        window.location = {reload: mockLocationReload} as any;

        const testState = mockRootState({
            modelCalibrate: mockModelCalibrateState({
                result: mockCalibrateResultResponse(),
                optionsFormMeta: mockOptionsFormMeta({
                    controlSections: [{
                        label: "Test Section",
                        description: "Just a test section",
                        controlGroups: [{
                            controls: [
                                {
                                    name: "TestValue",
                                    type: "number" as DynamicControlType,
                                    required: false,
                                    min: 0,
                                    max: 10,
                                    value: 5
                                },
                                {
                                    name: "TestValue2",
                                    type: "number" as DynamicControlType,
                                    required: false,
                                    min: 0,
                                    max: 10,
                                    value: 6
                                }
                            ]
                        }]
                    }]
                })
            })
        });

        await actions.updateStoreState({rootState} as any, testState);

        const root = mockSaveToLocalStorage.mock.calls[0][0] as RootState
        expect(root.modelCalibrate.options).toStrictEqual({"TestValue": 5, "TestValue2": 6});
        expect(mockLocationReload.mock.calls.length).toBe(1);
    });

    it("does not extracts calibrate options from dynamicFormMeta if model has not been calibrated", async () => {
        const mockSaveToLocalStorage = jest.fn();
        localStorageManager.savePartialState = mockSaveToLocalStorage;

        const mockLocationReload = jest.fn();
        delete window.location;
        window.location = {reload: mockLocationReload} as any;

        const testState = mockRootState({
            modelCalibrate: mockModelCalibrateState({
                optionsFormMeta: mockOptionsFormMeta({
                    controlSections: [{
                        label: "Test Section",
                        description: "Just a test section",
                        controlGroups: [{
                            controls: [
                                {
                                    name: "TestValue",
                                    type: "number" as DynamicControlType,
                                    required: false,
                                    min: 0,
                                    max: 10,
                                    value: 5
                                },
                                {
                                    name: "TestValue2",
                                    type: "number" as DynamicControlType,
                                    required: false,
                                    min: 0,
                                    max: 10,
                                    value: 6
                                }
                            ]
                        }]
                    }]
                })
            })
        });

        await actions.updateStoreState({rootState} as any, testState);

        const root = mockSaveToLocalStorage.mock.calls[0][0] as RootState
        expect(root.modelCalibrate.options).toStrictEqual({});
        expect(mockLocationReload.mock.calls.length).toBe(1);
    });

    it("calibrate options returns empty object if no options to extract from dynamic form meta", async () => {
        const mockSaveToLocalStorage = jest.fn();
        localStorageManager.savePartialState = mockSaveToLocalStorage;

        const mockLocationReload = jest.fn();
        delete window.location;
        window.location = {reload: mockLocationReload} as any;

        const testState = mockRootState({
            modelCalibrate: mockModelCalibrateState({
                optionsFormMeta: mockOptionsFormMeta({
                    controlSections: []
                })
            })
        });

        await actions.updateStoreState({rootState} as any, testState);

        const root = mockSaveToLocalStorage.mock.calls[0][0] as RootState
        expect(root.modelCalibrate.options).toStrictEqual({});
        expect(mockLocationReload.mock.calls.length).toBe(1);
    });

    it("can prepare rehydrate and dispatches poll action", (done) => {
        mockAxios.onPost("rehydrate/submit")
            .reply(200, mockSuccess(true));

        const file = new File(["TEST"], "testFile.zip")
        const fomData = new FormData()
        fomData.append("file", file)

        const dispatch = jest.fn();
        const commit = jest.fn();
        actions.preparingRehydrate({dispatch, commit, rootState} as any, fomData);

        const interval = setInterval(() => {
            expect(mockAxios.history.post.length).toBe(1)
            expect(mockAxios.history.post[0]["url"]).toBe("rehydrate/submit")
            expect(commit.mock.calls.length).toBe(2)
            expect(commit.mock.calls[0][0].type).toBe("SettingFiles")
            expect(commit.mock.calls[1][0].type).toBe("PreparingRehydrate")
            expect(commit.mock.calls[1][0].payload).toBeTruthy()
            expect(dispatch.mock.calls.length).toBe(1)
            expect(dispatch.mock.calls[0][0]).toEqual("pollRehydrate");
            clearInterval(interval);
            done();
        });
    });

    it("can pollRehydrate status and dispatches PollingStatusStarted action", async (done) => {
        mockAxios.onGet(`rehydrate/status/1`)
            .reply(200, mockSuccess(RunningStatusResponse));

        mockAxios.onGet(`rehydrate/result/1`)
            .reply(200, mockSuccess(rehydrateResultResponse));

        mockAxios.onPost(`session/files/`)
            .reply(200, mockSuccess({}));

        const sessionFilesPayload = {
            pjnz: {
                hash: "test.csv",
                filename: "test"
            },
            population: {
                hash: "test.csv",
                filename: "test"
            },
            shape: {
                hash: "test.csv",
                filename: "test"
            },
            anc: {
                hash: "test.csv",
                filename: "test"
            },
            survey: {
                hash: "test.csv",
                filename: "test"
            },
            programme: {
                hash: "test.csv",
                filename: "test"
            }
        }

        const commit = jest.fn();
        const dispatch = jest.fn()
        const rootGetters = {isGuest: false}
        const state = mockLoadState({rehydrateId: "1", projectName: "testProject"} as any)
        await actions.pollRehydrate({commit, dispatch, rootState, state, rootGetters} as any);

        setTimeout(() => {
            expect(mockAxios.history.get.length).toBe(2)
            expect(mockAxios.history.get[0]["url"]).toBe("rehydrate/status/1")
            expect(mockAxios.history.get[1]["url"]).toBe("rehydrate/result/1")
            expect(mockAxios.history.post.length).toBe(1)
            expect(mockAxios.history.post[0]["url"]).toBe("/session/files/")
            expect(JSON.parse(mockAxios.history.post[0]["data"])).toStrictEqual(sessionFilesPayload)
            expect(commit.mock.calls.length).toBe(4)
            expect(commit.mock.calls[0][0].type).toBe("RehydratePollingStarted")
            expect(commit.mock.calls[0][0].payload).toBeGreaterThan(1)
            expect(commit.mock.calls[1][0].type).toBe("RehydrateStatusUpdated")
            expect(commit.mock.calls[1][0].payload).toStrictEqual(RunningStatusResponse)
            expect(commit.mock.calls[2][0].type).toBe("RehydrateResult")
            expect(commit.mock.calls[2][0].payload).toStrictEqual(rehydrateResultResponse)
            expect(commit.mock.calls[3][0].type).toBe("UpdatingState")
            expect(commit.mock.calls[3][0].payload).toStrictEqual({})
            expect(dispatch.mock.calls.length).toBe(2)
            expect(dispatch.mock.calls[0][0]).toBe("projects/createProject")
            expect(dispatch.mock.calls[0][1]).toStrictEqual({
                name: "testProject",
                isUploaded: true
            })
            expect(dispatch.mock.calls[1][0]).toBe("updateStoreState")
            const root: RootState = dispatch.mock.calls[1][1]
            expect(root.baseline.pjnz).toStrictEqual(sessionFilesPayload.pjnz)
            expect(root.baseline.population).toStrictEqual(sessionFilesPayload.population)
            expect(root.baseline.shape).toStrictEqual(sessionFilesPayload.shape)

            expect(root.surveyAndProgram.anc).toStrictEqual(sessionFilesPayload.anc)
            expect(root.surveyAndProgram.survey).toStrictEqual(sessionFilesPayload.survey)
            expect(root.surveyAndProgram.program).toStrictEqual(sessionFilesPayload.programme)

            expect(root.projects.currentProject).toBe(null)
            expect(root.projects.currentVersion).toBe(null)
            done();
        }, 2100);
    });

    it("Update store states and does not dispatch create project action when user is guest", async (done) => {
        mockAxios.onGet(`rehydrate/status/1`)
            .reply(200, mockSuccess(RunningStatusResponse));

        mockAxios.onGet(`rehydrate/result/1`)
            .reply(200, mockSuccess(rehydrateResultResponse));

        mockAxios.onPost(`session/files/`)
            .reply(200, mockSuccess({}));

        const commit = jest.fn();
        const dispatch = jest.fn()
        const rootGetters = {isGuest: true}
        const state = mockLoadState({rehydrateId: "1"} as any)
        await actions.pollRehydrate({commit, dispatch, rootState, state, rootGetters} as any);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(4)
            expect(commit.mock.calls[2][0].type).toBe("RehydrateResult")
            expect(commit.mock.calls[2][0].payload).toStrictEqual(rehydrateResultResponse)
            expect(commit.mock.calls[3][0].type).toBe("UpdatingState")
            expect(commit.mock.calls[3][0].payload).toStrictEqual({})
            expect(dispatch.mock.calls.length).toStrictEqual(1)
            expect(dispatch.mock.calls[0][0]).toBe("updateStoreState")
            done();
        }, 2100);
    });

    it("calls RehydrateResultError when polling errored", async (done) => {
        mockAxios.onGet(`rehydrate/status/1`)
            .reply(500, mockFailure("ERROR"));

        const commit = jest.fn();
        const state = mockLoadState({rehydrateId: "1"} as any)
        await actions.pollRehydrate({commit, rootState, state} as any);

        setTimeout(() => {
            expect(commit.mock.calls.length).toBe(2)
            expect(commit.mock.calls[0][0].type).toBe("RehydratePollingStarted")
            expect(commit.mock.calls[0][0].payload).toBeGreaterThan(1)
            expect(commit.mock.calls[1][0].type).toBe("RehydrateResultError")
            expect(commit.mock.calls[1][0].payload).toStrictEqual(mockError("ERROR"))
            done();
        }, 2100);
    });
});
