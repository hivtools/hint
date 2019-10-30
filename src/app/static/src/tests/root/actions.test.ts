import {actions} from "../../app/store/root/actions";
import {mockStepperState} from "../mocks";

describe("root actions", () => {

    //NB in these tests 'valid' means complete with no preceding incomplete steps, or incomplete with no subsequent
    //complete steps

    it("does not reset state if all steps are valid", () => {

        const mockContext = {
            commit: jest.fn(),
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

        actions.validate(mockContext as any);
        expect(mockContext.commit).not.toHaveBeenCalled();
    });

    it("resets state if not all steps are valid", () => {


        const mockContext = {
            commit: jest.fn(),
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

        actions.validate(mockContext as any);
        expect(mockContext.commit).toHaveBeenCalled();
    });

    it("resets state if a step following current step is not valid", () => {


        const mockContext = {
            commit: jest.fn(),
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

        actions.validate(mockContext as any);
        expect(mockContext.commit).toHaveBeenCalled();
    });

    it("does not reset state if later steps than current are complete and incomplete, but all are valid", () => {


        const mockContext = {
            commit: jest.fn(),
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

        actions.validate(mockContext as any);
        expect(mockContext.commit).not.toHaveBeenCalled();
    });
});
