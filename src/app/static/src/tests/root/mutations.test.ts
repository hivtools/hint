import {mutations} from "../../app/store/root/mutations";
import {mockRootState, mockStepperState} from "../mocks";

describe("Root mutations", () => {

    it("can reset state", () => {

        const state = mockRootState({
            stepper: mockStepperState({activeStep: 2})
        });

        expect(state.stepper.activeStep).toBe(2);

        mutations.Reset(state);

        expect(state.stepper.activeStep).toBe(1);
    });

});
