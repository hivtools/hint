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

    it("can reset input state", () => {

        const state = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState({
                anc: "test" as any,
                survey: "test" as any,
                program: "test" as any
            }),
            filteredData: mockFilteredDataState({selectedDataType: DataType.ANC})
        });

        mutations.ResetInputs(state);
        expect(state.surveyAndProgram.anc).toBe(null);
        expect(state.surveyAndProgram.survey).toBe(null);
        expect(state.surveyAndProgram.program).toBe(null);
        expect(state.filteredData.selectedDataType).toBe(null);
    });

});

