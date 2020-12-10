import {
    mockBaselineState,
    mockModelRunState,
    mockRootState,
    mockStepperState,
    mockSurveyAndProgramState
} from "../mocks";
import {getters} from "../../app/store/stepper/getters";
import mock = jest.mock;

describe("stepper getters", () => {

    const state = mockStepperState({
        activeStep: 1
    });

    const testGetters = {
        complete: {
            1: true,
            2: true,
            3: false,
            4: false,
            5: false,
            6: false,
            7: false
        },
        hasChanges: {
            1: true,
            2: true,
            3: false,
            4: false,
            5: false,
            6: false,
            7: false
        }
    };

    it("is ready iff baseline, surveyAndProgram, modelRun are ready and adrSchemas present", () => {
        const rootState = mockRootState({
            adrSchemas: {baseUrl: "something"} as any,
            baseline: mockBaselineState({ready: true}),
            surveyAndProgram: mockSurveyAndProgramState({ready: true}),
            modelRun: mockModelRunState({ready: true})
        })
        let ready = getters.ready(state, testGetters, rootState, null as any);
        expect(ready).toBe(true);

        const baselineNotReady = {...rootState, baseline: mockBaselineState({ready: false})};
        ready = getters.ready(state, testGetters, baselineNotReady, null as any);
        expect(ready).toBe(false);

        const surveyAndProgramNotReady = {...rootState, surveyAndProgram: mockSurveyAndProgramState({ready: false})};
        ready = getters.ready(state, testGetters, surveyAndProgramNotReady, null as any);
        expect(ready).toBe(false);

        const modelRunNotReady = {...rootState, modelRun: mockModelRunState({ready: false})};
        ready = getters.ready(state, testGetters, modelRunNotReady, null as any);
        expect(ready).toBe(false);

        const schemasNotReady = {...rootState, adrSchemas: null};
        ready = getters.ready(state, testGetters, schemasNotReady, null as any);
        expect(ready).toBe(false);
    });

    it("returns changes to later steps", () => {
        const steps = getters.changesToLaterSteps(state, testGetters, null as any, null as any);
        expect(steps.length).toBe(1);
        expect(steps[0].number).toBe(2);
    });

    it("edits require confirmation if there are later steps with changes", () => {
        const localTestGetters = {...testGetters, changesToLaterSteps: [{}]};
        const result = getters.editsRequireConfirmation(state, localTestGetters, null as any, null as any);
        expect(result).toBe(true);
    });

    it("edits do not require confirmation if there are no later steps with changes", () => {
        const localTestGetters = {...testGetters, changesToLaterSteps: []};
        const result = getters.editsRequireConfirmation(state, localTestGetters, null as any, null as any);
        expect(result).toBe(false);
    });
});
