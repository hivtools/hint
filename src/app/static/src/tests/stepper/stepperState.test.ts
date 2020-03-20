import {localStorageManager} from "../../app/localStorageManager";
declare const currentUser: string; // set in jest config, or on the index page when run for real
localStorage.setItem("user", currentUser);
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
