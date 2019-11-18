import {mutations} from "../../app/store/root/mutations";
import {mockFilteredDataState, mockRootState, mockStepperState, mockSurveyAndProgramState} from "../mocks";
import {DataType} from "../../app/store/filteredData/filteredData";

describe("Root mutations", () => {

    it("can reset state", () => {

        const state = mockRootState({
            stepper: mockStepperState({activeStep: 2})
        });

        expect(state.stepper.activeStep).toBe(2);

        mutations.Reset(state);

        expect(state.stepper.activeStep).toBe(1);
    });

    it("can reset filtered data state", () => {

        const state = mockRootState({
            filteredData: mockFilteredDataState({selectedDataType: DataType.ANC})
        });

        mutations.ResetInputs(state);
        expect(state.filteredData.selectedDataType).toBe(null);
    });

});

