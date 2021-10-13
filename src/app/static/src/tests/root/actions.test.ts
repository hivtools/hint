import {actions, ErrorReportManualDetails} from "../../app/store/root/actions";
import Mock = jest.Mock;
import {
    mockAxios,
    mockBaselineState, mockError,
    mockModelCalibrateState,
    mockModelRunState, mockProjectsState,
    mockRootState,
    mockStepperState
} from "../mocks";
import {Language} from "../../app/store/translations/locales";
import {LanguageMutation} from "../../app/store/language/mutations";
import {RootMutation} from "../../app/store/root/mutations";
import {currentHintVersion} from "../../app/hintVersion";

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

    const expectChangeLanguageMutations = (commit: Mock) => {
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: RootMutation.SetUpdatingLanguage,
            payload: true
        });
        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: LanguageMutation.ChangeLanguage,
            payload: "fr"
        });

        expect(commit.mock.calls[2][0]).toStrictEqual({
            type: RootMutation.SetUpdatingLanguage,
            payload: false
        });
    };

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

    it("changeLanguage fetches nothing if no relevant metadata to fetch", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const rootState = mockRootState({baseline: {iso3: ""} as any})
        await actions.changeLanguage({commit, dispatch, rootState} as any, Language.fr);

        expectChangeLanguageMutations(commit);

        expect(dispatch.mock.calls.length).toBe(0)
    });

    it("generates error report", () => {
        const state = mockRootState({
            baseline: mockBaselineState({
                country: "Malawi"
            }),
            modelRun: mockModelRunState({
                modelRunId: "1234"
            }),
            projects: mockProjectsState({
                currentProject: {name: "p1", id: 1, versions: []}
            }),
            hintrVersion: {
                hintrVersion: {
                    naomi: "v1",
                    hintr: "v2",
                    rrq: "v3",
                    traduire: "v4"
                }
            }
        });

        const err = mockError("err")
        const getters = {
            errors: [err]
        }

        const payload: ErrorReportManualDetails = {
            email: "test@test.com",
            stepsToReproduce: "repro",
            section: "reviewInputs",
            description: "desc"
        }

        const result = actions.generateErrorReport({state, getters} as any, payload);
        expect(result.email).toBe("test@test.com");
        expect(result.description).toBe("desc");
        expect(result.section).toBe("reviewInputs");
        expect(result.country).toBe("Malawi");
        expect(result.errors).toEqual([err]);
        expect(result.browserAgent).toContain("jsdom");
        expect(result.jobId).toBe("1234");
        expect(result.stepsToReproduce).toBe("repro");
        expect(result.project).toBe("p1");
        expect(new Date(result.timeStamp).getDate()).toBe(new Date().getDate());
        expect(result.versions).toStrictEqual({
            naomi: "v1",
            hintr: "v2",
            rrq: "v3",
            traduire: "v4",
            hint: currentHintVersion
        });
    });

    it("error report can handle nulls", () => {
        const state = mockRootState();
        const getters = {
            errors: []
        }

        const payload: ErrorReportManualDetails = {
            email: "",
            stepsToReproduce: "",
            section: "",
            description: ""
        }

        const result = actions.generateErrorReport({state, getters} as any, payload);
        const expected = {
            country: "",
            project: undefined,
            jobId: "",
            description: "",
            section: "",
            stepsToReproduce: "",
            errors: []
        }
       expect(result).toMatchObject(expected);
    });

    it("error report contains logged in email if not overridden", () => {
        const state = mockRootState();
        const getters = {
            errors: []
        }

        const payload: ErrorReportManualDetails = {
            email: "",
            stepsToReproduce: "repro",
            section: "reviewInputs",
            description: "desc"
        }

        const result = actions.generateErrorReport({state, getters} as any, payload);
        expect(result.email).toBe("some.user@example.com");
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
