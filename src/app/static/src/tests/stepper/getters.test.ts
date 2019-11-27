import {mockStepperState} from "../mocks";
import {getters} from "../../app/store/stepper/getters";

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
            6: false
        }
    };

    it("returns later complete steps", () => {
        const steps = getters.laterCompleteSteps(state, testGetters, null as any, null as any);
        expect(steps.length).toBe(1);
        expect(steps[0].number).toBe(2);
    });

    it("edits require confirmation if there are later complete steps", () => {
        const localTestGetters = {...testGetters, laterCompleteSteps: [{}]};
        const result = getters.editsRequireConfirmation(state, localTestGetters, null as any, null as any);
        expect(result).toBe(true);
    });

    it("edits do not require confirmation if there are no later complete steps", () => {
        const localTestGetters = {...testGetters, laterCompleteSteps: []};
        const result = getters.editsRequireConfirmation(state, localTestGetters, null as any, null as any);
        expect(result).toBe(false);
    });
});
