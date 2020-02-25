import {localStorageManager} from "../../app/localStorageManager";

localStorageManager.saveState({
    stepper: {
        activeStep: 4
    },
    surveyAndProgram: {
        selectedDataType: null
    }
} as any);

import {stepper, StepperState} from "../../app/store/stepper/stepper";

it("loads initial state from local storage", () => {
    const state = stepper.state as StepperState;
    expect(state.activeStep).toBe(4);
});
