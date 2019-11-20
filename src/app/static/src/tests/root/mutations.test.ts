import {mutations} from "../../app/store/root/mutations";
import {initialModelRunState} from "../../app/store/modelRun/modelRun";
import {initialModelOptionsState} from "../../app/store/modelOptions/modelOptions";

import {
    mockAncResponse,
    mockFilteredDataState,
    mockModelOptionsState,
    mockModelRunState,
    mockRootState,
    mockSurveyAndProgramState, mockSurveyResponse
} from "../mocks";
import {DataType} from "../../app/store/filteredData/filteredData";

describe("Root mutations", () => {

    it("can reset state", () => {

        const state = mockRootState();

        // mutate simple prop
        state.stepper.activeStep = 2;
        // mutate nested prop
        state.filteredData.selectedChoroplethFilters.quarter = "test";

        mutations.Reset(state);

        expect(state.stepper.activeStep).toBe(1);
        expect(state.filteredData.selectedChoroplethFilters.quarter).toBe("");
        expect(state.baseline.ready).toBe(true);
        expect(state.surveyAndProgram.ready).toBe(true);
        expect(state.modelRun.ready).toBe(true);

        // do mutations again
        state.stepper.activeStep = 2;
        state.filteredData.selectedChoroplethFilters.quarter = "test";

        mutations.Reset(state);

        expect(state.stepper.activeStep).toBe(1);
        expect(state.filteredData.selectedChoroplethFilters.quarter).toBe("");

    });

    it("sets selected data type to null if no valid type available", () => {

        const state = mockRootState({
            filteredData: mockFilteredDataState({
                selectedDataType: DataType.ANC
            })
        });

        mutations.ResetInputs(state);
        expect(state.filteredData.selectedDataType).toBe(null);
    });

    it("sets selected data type to available type if there is one", () => {

        const state = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState({
                survey: mockSurveyResponse()
            }),
            filteredData: mockFilteredDataState({
                selectedDataType: DataType.ANC
            })
        });

        mutations.ResetInputs(state);
        expect(state.filteredData.selectedDataType).toBe(DataType.Survey);
    });

    it("leaves selected data type as is if valid", () => {

        const state = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState({
                anc: mockAncResponse()
            }),
            filteredData: mockFilteredDataState({
                selectedDataType: DataType.ANC
            })
        });

        mutations.ResetInputs(state);
        expect(state.filteredData.selectedDataType).toBe(DataType.ANC);
    });

    it("can reset model options state", () => {

        const state = mockRootState({
            modelOptions: mockModelOptionsState({options: "TEST" as any})
        });

        mutations.ResetOptions(state);
        expect(state.modelOptions).toStrictEqual(initialModelOptionsState());
    });

    it("can reset model outputs state", () => {

        const state = mockRootState({
            modelRun: mockModelRunState({modelRunId: "TEST"}),
            modelOutput: {dummyProperty: "TEST" as any}
        });

        mutations.ResetOutputs(state);
        expect(state.modelRun).toStrictEqual({...initialModelRunState(), ready: true});
        expect(state.modelOutput.dummyProperty).toBe(false);

        expect(state.filteredData.selectedChoroplethFilters.quarter).toBe("");
        expect(state.filteredData.selectedChoroplethFilters.age).toBe("");
        expect(state.filteredData.selectedChoroplethFilters.sex).toBe("");
        expect(state.filteredData.selectedChoroplethFilters.survey).toBe("");
        expect(state.filteredData.selectedChoroplethFilters.regions).toStrictEqual([]);
    });

});

