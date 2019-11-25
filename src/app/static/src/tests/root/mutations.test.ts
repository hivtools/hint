import {mutations} from "../../app/store/root/mutations";
import {mockRootState, mockSurveyAndProgramState} from "../mocks";

describe("Root mutations", () => {

    it("can reset state", () => {

        const state = mockRootState();

        // mutate simple prop
        state.stepper.activeStep = 2;
        // mutate nested prop
        state.filteredData.selectedChoroplethFilters.year = "test";

        mutations.Reset(state);

        expect(state.stepper.activeStep).toBe(1);
        expect(state.filteredData.selectedChoroplethFilters.year).toBe("");

        // do mutations again
        state.stepper.activeStep = 2;
        state.filteredData.selectedChoroplethFilters.year = "test";

        mutations.Reset(state);

        expect(state.stepper.activeStep).toBe(1);
        expect(state.filteredData.selectedChoroplethFilters.year).toBe("");
    });

    it("can reset input state", () => {

        const state = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState({
                anc: "test" as any,
                survey: "test" as any,
                program: "test" as any
            })
        });

        // simulate mutations
        state.filteredData.selectedChoroplethFilters.age = "1";
        state.filteredData.selectedChoroplethFilters.year = "1";
        state.filteredData.selectedChoroplethFilters.survey = "1";
        state.filteredData.selectedChoroplethFilters.sex = "1";
        state.filteredData.selectedChoroplethFilters.regions = ["1"];

        mutations.ResetInputs(state);
        expect(state.surveyAndProgram.anc).toBe(null);
        expect(state.surveyAndProgram.survey).toBe(null);
        expect(state.surveyAndProgram.program).toBe(null);
        expect(state.filteredData.selectedDataType).toBe(null);

        expect(state.filteredData.selectedChoroplethFilters.year).toBe("");
        expect(state.filteredData.selectedChoroplethFilters.age).toBe("");
        expect(state.filteredData.selectedChoroplethFilters.sex).toBe("");
        expect(state.filteredData.selectedChoroplethFilters.survey).toBe("");
        expect(state.filteredData.selectedChoroplethFilters.regions).toStrictEqual([]);

    });

});

