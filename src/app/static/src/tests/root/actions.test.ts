import {actions} from "../../app/store/root/actions";
import {ErrorReport, ErrorReportManualDetails} from "../../app/types";
import {
    mockAxios,
    mockFailure,
    mockBaselineState,
    mockError,
    mockGenericChartState,
    mockHintrVersionState,
    mockModelCalibrateState,
    mockModelRunState,
    mockProjectsState,
    mockRootState,
    mockStepperState,
    mockSuccess, mockDownloadResultsState
} from "../mocks";
import {Language} from "../../app/store/translations/locales";
import {currentHintVersion} from "../../app/hintVersion";
import {expectChangeLanguageMutations} from "../testHelpers";


describe("root actions", () => {

    beforeEach(() => {
        mockAxios.reset();
    });

    //NB in these tests 'valid' means complete with no preceding incomplete steps, or incomplete with no subsequent
    //complete steps

    it("does not reset state if all steps are valid", async () => {

        const mockContext = {
            commit: jest.fn(),
            dispatch: jest.fn(),
            getters: {
                "stepper/complete": {
                    1: true,
                    2: true
                }
            },
            state: {
                stepper: mockStepperState({
                    activeStep: 3
                })
            }
        };

        await actions.validate(mockContext as any);
        expect(mockContext.commit).not.toHaveBeenCalled();
        expect(mockContext.dispatch).not.toHaveBeenCalled();
    });

    it("resets state if not all steps are valid", async () => {


        const mockContext = {
            commit: jest.fn(),
            dispatch: jest.fn(),
            getters: {
                "stepper/complete": {
                    1: true,
                    2: false
                }
            },
            state: {
                stepper: mockStepperState({
                    activeStep: 3
                })
            }
        };

        await actions.validate(mockContext as any);

        expect(mockContext.dispatch).toHaveBeenCalled();
        expect(mockContext.commit.mock.calls[0][0]).toStrictEqual({type: "Reset", payload: 1});
        expect(mockContext.commit.mock.calls[1][0]).toStrictEqual({type: "ResetSelectedDataType"});

        expect(mockContext.commit.mock.calls[2][0]).toStrictEqual({
            type: "load/LoadFailed",
            payload: {detail: "There was a problem loading your data. Some data may have been invalid. Please contact support if this issue persists."}
        });
    });

    it("resets state if a step following current step is not valid", async () => {
        const mockContext = {
            commit: jest.fn(),
            dispatch: jest.fn(),
            getters: {
                "stepper/complete": {
                    1: true,
                    2: false,
                    3: true
                }
            },
            state: {
                stepper: mockStepperState({
                    activeStep: 1
                })
            }
        };

        await actions.validate(mockContext as any);
        expect(mockContext.dispatch).toHaveBeenCalled();

        expect(mockContext.commit.mock.calls[0][0]).toStrictEqual({type: "Reset", payload: 1});
        expect(mockContext.commit.mock.calls[1][0]).toStrictEqual({type: "ResetSelectedDataType"});
    });

    it("does not reset state if later steps than current are complete and incomplete, but all are valid", async () => {
        const mockContext = {
            commit: jest.fn(),
            dispatch: jest.fn(),
            getters: {
                "stepper/complete": {
                    1: true,
                    2: true,
                    3: false
                }
            },
            state: {
                stepper: mockStepperState({
                    activeStep: 1
                })
            }
        };

        await actions.validate(mockContext as any);
        expect(mockContext.commit).not.toHaveBeenCalled();
        expect(mockContext.dispatch).not.toHaveBeenCalled();
    });

    it("dispatches delete baseline and surveyAndProgram action if baseline step is not valid", async () => {
        const mockContext = {
            commit: jest.fn(),
            dispatch: jest.fn(),
            getters: {
                "stepper/complete": {
                    1: false,
                    2: false
                }
            },
            state: {
                stepper: mockStepperState({
                    activeStep: 3
                })
            }
        };

        await actions.validate(mockContext as any);
        expect(mockContext.dispatch.mock.calls[0][0]).toBe("baseline/deleteAll");
        expect(mockContext.dispatch.mock.calls[1][0]).toBe("surveyAndProgram/deleteAll");
    });

    it("dispatches delete surveyAndProgram action if surveyAndProgram step is not valid", async () => {
        const mockContext = {
            commit: jest.fn(),
            dispatch: jest.fn(),
            getters: {
                "stepper/complete": {
                    1: true,
                    2: false
                }
            },
            state: {
                stepper: mockStepperState({
                    activeStep: 3
                })
            }
        };

        await actions.validate(mockContext as any);
        expect(mockContext.dispatch.mock.calls[0][0]).toBe("surveyAndProgram/deleteAll");
    });

    it("dispatches no delete action if baseline and surveyAndProgram steps are valid", async () => {
        const mockContext = {
            commit: jest.fn(),
            dispatch: jest.fn(),
            getters: {
                "stepper/complete": {
                    1: true,
                    2: true,
                    3: false
                }
            },
            state: {
                stepper: mockStepperState({
                    activeStep: 4
                })
            }
        };

        await actions.validate(mockContext as any);
        expect(mockContext.dispatch).not.toHaveBeenCalled();
    });

    it("posts error report to teams", async () => {
        const url = "error-report"

        mockAxios.onPost(url)
            .reply(200, mockSuccess("ok"));

        const rootState = mockRootState({
            baseline: mockBaselineState({
                country: "Malawi"
            }),
            modelRun: mockModelRunState({
                modelRunId: "1234"
            }),
            modelCalibrate: mockModelCalibrateState({
                calibrateId: "2022"
            }),
            downloadResults: mockDownloadResultsState({
                summary: {
                    downloadId: "summary123"
                },
                spectrum: {
                    downloadId: "spectrum123"
                }
            } as any),
            projects: mockProjectsState({
                currentProject: {name: "p1", id: 1, versions: []}
            }),
            hintrVersion: mockHintrVersionState({
                hintrVersion: {
                    naomi: "v1",
                    hintr: "v2",
                    rrq: "v3",
                    traduire: "v4"
                }
            })
        });

        const err = mockError("err")
        const getters = {
            errors: [err]
        }
        const commit = jest.fn();
        const dispatch = jest.fn();

        const payload: ErrorReportManualDetails = {
            email: "test@example.com",
            stepsToReproduce: "repro",
            section: "reviewInputs",
            description: "desc"
        }

        await actions.generateErrorReport({commit, rootState, getters, dispatch} as any, payload);

        expect(commit.mock.calls.length).toEqual(3);
        expect(commit.mock.calls[0][0]).toEqual({payload: true, type: "errors/SendingErrorReport"});
        expect(commit.mock.calls[1][0]).toEqual({payload: "ok", type: "errors/ErrorReportSuccess"});
        expect(commit.mock.calls[2][0]).toEqual({payload: false, type: "errors/SendingErrorReport"});
        expect(dispatch.mock.calls.length).toEqual(1);
        expect(dispatch.mock.calls[0][0]).toEqual("projects/cloneProject");
        expect(mockAxios.history.post.length).toEqual(1)
        expect(mockAxios.history.post[0].url).toEqual(url)

        const expected = {
            email: "test@example.com",
            country: "Malawi",
            projectName: "p1",
            timeStamp: new Date(),
            modelRunId: "1234",
            calibrateId: "2022",
            downloadIds: {spectrum: "spectrum123", summary: "summary123", coarse_output: "none"},
            description: "desc",
            section: "reviewInputs",
            stepsToReproduce: "repro",
            errors: getters.errors

        };

        const data = JSON.parse(mockAxios.history.post[0].data) as ErrorReport

        expect(data.email).toStrictEqual(expected.email)
        expect(data.country).toStrictEqual(expected.country)
        expect(data.projectName).toStrictEqual(expected.projectName)
        expect(data.browserAgent).toContain("Mozilla")
        expect(data.modelRunId).toStrictEqual(expected.modelRunId)
        expect(data.calibrateId).toStrictEqual(expected.calibrateId)
        expect(data.downloadIds).toStrictEqual(expected.downloadIds)
        expect(new Date(data.timeStamp).getDate()).toBe(expected.timeStamp.getDate());
        expect(data.description).toStrictEqual(expected.description)
        expect(data.section).toStrictEqual(expected.section)
        expect(data.stepsToReproduce).toStrictEqual(expected.stepsToReproduce)
        expect(data.errors).toStrictEqual(expected.errors)
        expect(data.versions).toStrictEqual({
            naomi: "v1",
            hintr: "v2",
            rrq: "v3",
            traduire: "v4",
            hint: currentHintVersion
        });
    });

    it("sends default values when country, project or jobId are missing", async () => {
        const url = "error-report"

        mockAxios.onPost(url)
            .reply(200, mockSuccess("ok"));

        const rootState = mockRootState({
            baseline: mockBaselineState(),
            modelRun: mockModelRunState(),
            modelCalibrate: mockModelCalibrateState(),
            downloadResults: mockDownloadResultsState(),
            projects: mockProjectsState(),
            hintrVersion: mockHintrVersionState({
                hintrVersion: {
                    naomi: "v1",
                    hintr: "v2",
                    rrq: "v3",
                    traduire: "v4"
                }
            })
        });

        const err = mockError("err")
        const getters = {
            errors: [err]
        }
        const commit = jest.fn();
        const dispatch = jest.fn();

        const payload: ErrorReportManualDetails = {
            email: "test@example.com",
            stepsToReproduce: "repro",
            section: "reviewInputs",
            description: "desc"
        }

        await actions.generateErrorReport({commit, rootState, getters, dispatch} as any, payload);

        expect(commit.mock.calls.length).toEqual(3);

        expect(commit.mock.calls[0][0]).toEqual({payload: true, type: "errors/SendingErrorReport"});
        expect(commit.mock.calls[1][0]).toEqual({"payload": "ok", "type": "errors/ErrorReportSuccess"});
        expect(commit.mock.calls[2][0]).toEqual({payload: false, type: "errors/SendingErrorReport"});
        expect(dispatch.mock.calls.length).toEqual(0);
        expect(mockAxios.history.post.length).toEqual(1)
        expect(mockAxios.history.post[0].url).toEqual(url)

        const expected = {
            email: "test@example.com",
            country: "no associated country",
            projectName: "no associated project",
            timeStamp: new Date(),
            modelRunId: "no associated modelRunId",
            calibrateId: "no associated calibrateId",
            downloadIds: {spectrum: "none", summary: "none", coarse_output: "none"},
            description: "desc",
            section: "reviewInputs",
            stepsToReproduce: "repro",
            errors: getters.errors
        };

        const data = JSON.parse(mockAxios.history.post[0].data) as ErrorReport

        expect(data.email).toStrictEqual(expected.email)
        expect(data.country).toStrictEqual(expected.country)
        expect(data.projectName).toBe(expected.projectName)
        expect(data.modelRunId).toStrictEqual(expected.modelRunId)
        expect(data.calibrateId).toStrictEqual(expected.calibrateId)
        expect(data.downloadIds).toStrictEqual(expected.downloadIds)
        expect(data.browserAgent).toContain("Mozilla")
        expect(new Date(data.timeStamp).getDate()).toBe(expected.timeStamp.getDate());
        expect(data.description).toStrictEqual(expected.description)
        expect(data.section).toStrictEqual(expected.section)
        expect(data.stepsToReproduce).toStrictEqual(expected.stepsToReproduce)
        expect(data.errors).toStrictEqual(expected.errors)
    });

    it("can return error when error report fails", async () => {
        const url = "error-report"

        mockAxios.onPost(url)
            .reply(500, mockFailure("TestError"));

        const rootState = mockRootState();

        const commit = jest.fn();

        const dispatch = jest.fn();

        const getters = {
            errors: []
        }

        const payload: ErrorReportManualDetails = {
            email: "",
            stepsToReproduce: "",
            section: "",
            description: ""
        }

        await actions.generateErrorReport({commit, rootState, getters, dispatch} as any, payload);

        const expectedError = {error: "OTHER_ERROR", detail: "TestError"};

        expect(commit.mock.calls.length).toEqual(3);
        expect(commit.mock.calls[0][0]).toEqual({payload: true, type: "errors/SendingErrorReport"});
        expect(commit.mock.calls[1][0]).toEqual({payload: expectedError, type: "errors/ErrorReportError"});
        expect(commit.mock.calls[2][0]).toEqual({payload: false, type: "errors/SendingErrorReport"});
        expect(dispatch.mock.calls.length).toBe(0)
    });

    it("changeLanguage fetches plotting metadata and calibrate result", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const rootState = mockRootState(
            {
                baseline: mockBaselineState({iso3: "MWI"}),
                modelCalibrate: mockModelCalibrateState({
                    status: {
                        done: true
                    } as any
                })
            });
        await actions.changeLanguage({commit, dispatch, rootState} as any, Language.fr);

        expectChangeLanguageMutations(commit);

        expect(dispatch.mock.calls.length).toBe(2);
        expect(dispatch.mock.calls[0][0]).toStrictEqual("metadata/getPlottingMetadata");
        expect(dispatch.mock.calls[0][1]).toStrictEqual("MWI");

        expect(dispatch.mock.calls[1][0]).toStrictEqual("modelCalibrate/getResult");
    });

    it("changeLanguage does not fetch plotting metadata if country code is empty", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const rootState = mockRootState(
            {
                modelCalibrate: mockModelCalibrateState({
                    status: {
                        done: true
                    } as any
                })
            });
        await actions.changeLanguage({commit, dispatch, rootState} as any, Language.fr);

        expectChangeLanguageMutations(commit);

        expect(dispatch.mock.calls.length).toBe(1);
        expect(dispatch.mock.calls[0][0]).toStrictEqual("modelCalibrate/getResult");
    });

    it("changeLanguage does not fetch calibrate result if calibrate is not complete", async () =>{
        const commit = jest.fn();
        const dispatch = jest.fn();
        const rootState = mockRootState(
            {
                baseline: mockBaselineState({iso3: "MWI"}),
                modelCalibrate: mockModelCalibrateState({
                    status: {
                        done: false
                    } as any
                })
            });
        await actions.changeLanguage({commit, dispatch, rootState} as any, Language.fr);

        expectChangeLanguageMutations(commit);

        expect(dispatch.mock.calls.length).toBe(1);
        expect(dispatch.mock.calls[0][0]).toStrictEqual("metadata/getPlottingMetadata");
        expect(dispatch.mock.calls[0][1]).toStrictEqual("MWI");
    });

    it("changeLanguage refreshes genericChart datasets, if any", async() => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const rootState = mockRootState(
            {
                baseline: mockBaselineState({iso3: "MWI"}),
                genericChart: mockGenericChartState({datasets: {dataset1: "TEST"}} as any)
        });
        await actions.changeLanguage({commit, dispatch, rootState} as any, Language.fr);

        expectChangeLanguageMutations(commit);

        expect(dispatch.mock.calls.length).toBe(2);
        expect(dispatch.mock.calls[0][0]).toStrictEqual("metadata/getPlottingMetadata");
        expect(dispatch.mock.calls[1][0]).toStrictEqual("genericChart/refreshDatasets");
    });

    it("changeLanguage fetches nothing if no relevant metadata to fetch", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const rootState = mockRootState({baseline: {iso3: ""} as any})
        await actions.changeLanguage({commit, dispatch, rootState} as any, Language.fr);

        expectChangeLanguageMutations(commit);

        expect(dispatch.mock.calls.length).toBe(0)
    });

    it("changeLanguage does nothing if new language is the same as current language", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const rootState = mockRootState(
            {
                language: Language.fr,
                baseline: mockBaselineState({iso3: "MWI"}),
                modelCalibrate: mockModelCalibrateState({
                    status: {
                        done: true
                    } as any
                })
            });
        await actions.changeLanguage({commit, dispatch, rootState} as any, Language.fr);

        expect(commit.mock.calls.length).toBe(0);
        expect(dispatch.mock.calls.length).toBe(0);
    });

});