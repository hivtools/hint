import {mutations, RootMutation} from "../../app/store/root/mutations";
import {initialModelRunState} from "../../app/store/modelRun/modelRun";
import {initialModelOptionsState} from "../../app/store/modelOptions/modelOptions";

import {
    mockAncResponse,
    mockBaselineState,
    mockError, mockErrorsState,
    mockFilteredDataState, mockLoadState,
    mockMetadataState,
    mockModelOptionsState,
    mockModelOutputState,
    mockPlottingSelections,
    mockStepperState,
    mockModelRunState,
    mockRootState,
    mockSurveyAndProgramState,
    mockSurveyResponse
} from "../mocks";
import {DataType, initialFilteredDataState} from "../../app/store/filteredData/filteredData";
import {RootState} from "../../app/root";
import {
    BarchartSelections,
    initialPlottingSelectionsState
} from "../../app/store/plottingSelections/plottingSelections";
import {initialMetadataState} from "../../app/store/metadata/metadata";
import {initialModelOutputState} from "../../app/store/modelOutput/modelOutput";
import {initialLoadState} from "../../app/store/load/load";
import {initialErrorsState} from "../../app/store/errors/errors";

describe("Root mutations", () => {

    const populatedState = function() {
        return mockRootState({
            baseline: mockBaselineState({country: "Test Country", ready: true}),
            metadata: mockMetadataState({plottingMetadataError: mockError("Test Metadata Error")}),
            surveyAndProgram: mockSurveyAndProgramState({surveyError: mockError("Test Survey Error"), ready: true}),
            modelOptions: mockModelOptionsState({valid: true}),
            modelOutput: mockModelOutputState({selectedTab: "Barchart"}),
            modelRun: mockModelRunState({modelRunId: "123"}),
            plottingSelections: mockPlottingSelections({barchart: {indicatorId: "Test Indicator"} as BarchartSelections}),
            filteredData: mockFilteredDataState({selectedDataType: DataType.Output}),
            stepper: mockStepperState({activeStep: 6}),
            load: mockLoadState({loadError: mockError("Test Load Error")}),
            errors: mockErrorsState({errors: [mockError("Test Error")]})
        });
    };

    const testOnlyExpectedModulesArePopulated = function(modules: string[], state: RootState) {
        const popState = populatedState();

        //These modules may or may not be reset depending on the last valid step
        expect(state.baseline).toStrictEqual(modules.includes("baseline") ?  popState.baseline : mockBaselineState({ready: true}));
        expect(state.metadata).toStrictEqual(modules.includes("metadata") ? popState.metadata : initialMetadataState());
        expect(state.surveyAndProgram).toStrictEqual(modules.includes("surveyAndProgram") ? popState.surveyAndProgram :
            mockSurveyAndProgramState({ready: true}));
        expect(state.modelOptions).toStrictEqual(modules.includes("modelOptions") ? popState.modelOptions : initialModelOptionsState());

        //These modules are always reset
        expect(state.modelOutput).toStrictEqual(initialModelOutputState());
        expect(state.modelRun).toStrictEqual(mockModelRunState({ready: true}));
        expect(state.plottingSelections).toStrictEqual(initialPlottingSelectionsState());
        expect(state.load).toStrictEqual(initialLoadState());
        expect(state.errors).toStrictEqual(initialErrorsState());

        //FilteredData is never reset - it is possibly modified in a separate mutations
        expect(state.filteredData).toStrictEqual(popState.filteredData);

        //we skip stepper state this needs to be tested separately, activeStep may have been modified
    };

    it("can reset state where max valid step is 0", () => {
        const state = populatedState();

        mutations.Reset(state, {payload: 0});

        testOnlyExpectedModulesArePopulated([], state);
        expect(state.stepper.activeStep).toBe(1);
    });

    it("can reset state where max valid step is 1", () => {
        const state = populatedState();

        mutations.Reset(state, {payload: 1});

        testOnlyExpectedModulesArePopulated(["baseline", "metadata"], state);
        expect(state.stepper.activeStep).toBe(1);
    });

    it("can reset state where max valid step is 2", () => {
        const state = populatedState();

        mutations.Reset(state, {payload: 2});

        testOnlyExpectedModulesArePopulated(["baseline", "metadata", "surveyAndProgram"], state);
        expect(state.stepper.activeStep).toBe(2);
    });

    it("can reset state where max valid step is 3", () => {
        const state = populatedState();

        mutations.Reset(state, {payload: 3});

        testOnlyExpectedModulesArePopulated(["baseline", "metadata", "surveyAndProgram", "modelOptions"], state);
        expect(state.stepper.activeStep).toBe(3);
    });

    it("can reset state where max valid step is 4", () => {
        const state = populatedState();

        mutations.Reset(state, {payload: 4});

        testOnlyExpectedModulesArePopulated(["baseline", "metadata", "surveyAndProgram", "modelOptions"], state);
        expect(state.stepper.activeStep).toBe(4);
    });

    it("can reset state where max valid step is 5", () => {
        const state = populatedState();

        mutations.Reset(state, {payload: 5});

        testOnlyExpectedModulesArePopulated(["baseline", "metadata", "surveyAndProgram", "modelOptions"], state);
        expect(state.stepper.activeStep).toBe(4);
    });

    it("sets selected data type to null if no valid type available", () => {

        const state = mockRootState({
            filteredData: mockFilteredDataState({
                selectedDataType: DataType.ANC
            })
        });

        mutations.ResetFilteredDataSelections(state);
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

        mutations.ResetFilteredDataSelections(state);
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

        // simulate mutations
        state.filteredData.selectedChoroplethFilters.age = "1";
        state.filteredData.selectedChoroplethFilters.year = "1";
        state.filteredData.selectedChoroplethFilters.survey = "1";
        state.filteredData.selectedChoroplethFilters.sex = "1";
        state.filteredData.selectedChoroplethFilters.regions = ["1"];

        mutations.ResetFilteredDataSelections(state);
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
            modelOutput: {selectedTab: "TEST"}
        });

        state.plottingSelections.barchart.xAxisId = "test";

        mutations.ResetOutputs(state);
        expect(state.modelRun).toStrictEqual({...initialModelRunState(), ready: true});
        expect(state.modelOutput.selectedTab).toBe("");

        expect(state.filteredData.selectedChoroplethFilters.year).toBe("");
        expect(state.filteredData.selectedChoroplethFilters.age).toBe("");
        expect(state.filteredData.selectedChoroplethFilters.sex).toBe("");
        expect(state.filteredData.selectedChoroplethFilters.survey).toBe("");
        expect(state.filteredData.selectedChoroplethFilters.regions).toStrictEqual([]);

        expect(state.plottingSelections.barchart.xAxisId).toBe("");
    });

    it("can change language", () => {
        const state = mockRootState();
        mutations[RootMutation.ChangeLanguage](state, {payload: "fr"});
        expect(state.language).toBe("fr");
    });
});

