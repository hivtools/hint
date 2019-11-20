import {mutations} from "../../app/store/root/mutations";
import {initialModelRunState} from "../../app/store/modelRun/modelRun";
import {initialModelOptionsState} from "../../app/store/modelOptions/modelOptions";

import {mockModelOptionsState, mockModelRunState, mockRootState} from "../mocks";

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

    it("can reset filtered data state", () => {

        const state = mockRootState();

        // simulate mutations
        state.filteredData.selectedChoroplethFilters.age = "1";
        state.filteredData.selectedChoroplethFilters.quarter = "1";
        state.filteredData.selectedChoroplethFilters.survey = "1";
        state.filteredData.selectedChoroplethFilters.sex = "1";
        state.filteredData.selectedChoroplethFilters.regions = ["1"];

        mutations.ResetInputs(state);
        expect(state.filteredData.selectedDataType).toBe(null);

        expect(state.filteredData.selectedChoroplethFilters.age).toBe("");
        expect(state.filteredData.selectedChoroplethFilters.sex).toBe("");
        expect(state.filteredData.selectedChoroplethFilters.survey).toBe("");
        expect(state.filteredData.selectedChoroplethFilters.quarter).toBe("");
        expect(state.filteredData.selectedChoroplethFilters.regions).toEqual([]);

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

