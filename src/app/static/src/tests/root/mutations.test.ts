import {mutations} from "../../app/store/root/mutations";
import {
    mockFilteredDataState, mockModelOptionsState,
    mockModelRunState,
    mockRootState,
    mockStepperState,
    mockSurveyAndProgramState
} from "../mocks";
import {DataType, initialFilteredDataState} from "../../app/store/filteredData/filteredData";
import {initialModelRunState} from "../../app/store/modelRun/modelRun";
import {initialModelOptionsState} from "../../app/store/modelOptions/modelOptions";
import {initialBaselineState} from "../../app/store/baseline/baseline";
import {initialSurveyAndProgramDataState} from "../../app/store/surveyAndProgram/surveyAndProgram";

describe("Root mutations", () => {

    it("can reset state", () => {

        const state = mockRootState({
            stepper: mockStepperState({activeStep: 2})
        });

        expect(state.stepper.activeStep).toBe(2);

        mutations.Reset(state);

        expect(state.stepper.activeStep).toBe(1);

        // test that we haven't passed initial states by reference!
        expect(initialBaselineState.ready).toBe(false);
        expect(initialSurveyAndProgramDataState.ready).toBe(false);
        expect(initialModelRunState.ready).toBe(false);

        expect(state.baseline.ready).toBe(true);
        expect(state.surveyAndProgram.ready).toBe(true);
        expect(state.modelRun.ready).toBe(true);
    });

    it("can reset filtered data state", () => {

        const state = mockRootState({
            filteredData: mockFilteredDataState({
                selectedDataType: DataType.ANC,
                selectedChoroplethFilters: {age: "1", sex: "both", survey: "s1", regions: ["test"], quarter: "1"}})
        });

        mutations.ResetInputs(state);
        expect(state.filteredData.selectedDataType).toBe(null);
        expect(state.filteredData.selectedChoroplethFilters.age).toBe("");
        expect(state.filteredData.selectedChoroplethFilters.sex).toBe("");
        expect(state.filteredData.selectedChoroplethFilters.survey).toBe("");
        expect(state.filteredData.selectedChoroplethFilters.quarter).toBe("");
        expect(state.filteredData.selectedChoroplethFilters.regions).toEqual([]);

        state.filteredData.selectedChoroplethFilters.sex = "1";
        expect(initialFilteredDataState.selectedChoroplethFilters.sex).toBe("");
    });

    it("can reset model options state", () => {

        const state = mockRootState({
            modelOptions: mockModelOptionsState({options: "TEST" as any})
        });

        mutations.ResetOptions(state);
        expect(state.modelOptions).toStrictEqual(initialModelOptionsState);
    });

    it("can reset model outputs state", () => {

        const state = mockRootState({
            modelRun: mockModelRunState({modelRunId: "TEST"}),
            modelOutput: {dummyProperty: "TEST" as any}
        });

        mutations.ResetOutputs(state);
        expect(state.modelRun).toStrictEqual({...initialModelRunState, ready: true});
        expect(state.modelOutput.dummyProperty).toBe(false);

    });

});

