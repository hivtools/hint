import {mutations} from "../../app/store/plottingSelections/mutations";
import {mockColourScales, mockPlottingSelections} from "../mocks";
import {DataType} from "../../app/store/surveyAndProgram/surveyAndProgram";
import {ScaleType} from "../../app/store/plottingSelections/plottingSelections";

describe("Plotting selections mutations", () => {

    it("updates barchart selections", () => {
        const testState = mockPlottingSelections();
        const newBarchartSelections = {
            indicatorId: "test-indicator",
            disaggregateById: "test-disagg",
            selectedFilterOptions: {
                testFilter: []
            }
        };
        mutations.updateBarchartSelections(testState, {payload: newBarchartSelections});

        expect(testState.barchart).toStrictEqual({
            indicatorId: "test-indicator",
            disaggregateById: "test-disagg",
            xAxisId: "",
            selectedFilterOptions: {
                testFilter: []
            }
        });
    });

    it("updates bubble plot selections", () => {
        const testState = mockPlottingSelections();
        const newBubbleSelections = {
            selectedFilterOptions: {testFilter: [{id: "1", label: "one"}]}
        };
        mutations.updateBubblePlotSelections(testState, {payload: newBubbleSelections});
        expect(testState.bubble).toStrictEqual({
            colorIndicatorId: "",
            sizeIndicatorId: "",
            detail: -1,
            selectedFilterOptions: {testFilter: [{id: "1", label: "one"}]}
        });
    });

    it("updates SAP Choropleth selections", () => {
        const testState = mockPlottingSelections();
        const newChoroSelections = {
            selectedFilterOptions: {testFilter: [{id: "1", label: "one"}]}
        };
        mutations.updateSAPChoroplethSelections(testState, {payload: newChoroSelections});
        expect(testState.sapChoropleth).toStrictEqual({
            indicatorId: "",
            detail: -1,
            selectedFilterOptions: {testFilter: [{id: "1", label: "one"}]}
        });
    });

    it("updates Output Choropleth selections", () => {
        const testState = mockPlottingSelections();
        const newChoroSelections = {
            detail: 2
        };
        mutations.updateOutputChoroplethSelections(testState, {payload: newChoroSelections});
        expect(testState.outputChoropleth).toStrictEqual({
            indicatorId: "",
            detail: 2,
            selectedFilterOptions: {}
        });
    });

    const testScales = {
        prevalence: {
            type: ScaleType.Default
        }
    };

    it("updateOutputColourScales updates colour output scales", () => {
        const testState = mockPlottingSelections();
        mutations.updateOutputColourScales(testState, {
            type: "updateOutputColourScales",
            payload: testScales
        });
        expect(testState.colourScales.output).toBe(testScales);
    });

    it("updateOutputBubbleSizeScales updates bubble size output scales", () => {
        const testState = mockPlottingSelections();
        mutations.updateOutputBubbleSizeScales(testState, {
            type: "updateOutputBubbleSizeScales",
            payload: testScales
        });
        expect(testState.bubbleSizeScales.output).toBe(testScales);
    });

    it("updateSAPColourScales updates colour scales correctly for survey", () => {
        const testState = mockPlottingSelections();
        mutations.updateSAPColourScales(testState, {
            type: "updateSAPColourScales",
            payload: [DataType.Survey, testScales]
        });
        expect(testState.colourScales.survey).toBe(testScales);
    });

    it("updateSAPColourScales updates colour scales correctly for program", () => {
        const testState = mockPlottingSelections();
        mutations.updateSAPColourScales(testState, {
            type: "updateSAPColourScales",
            payload: [DataType.Program, testScales]
        });
        expect(testState.colourScales.program).toBe(testScales);
    });

    it("updateSAPColourScales updates colour scales correctly for anc", () => {
        const testState = mockPlottingSelections();
        mutations.updateSAPColourScales(testState, {
            type: "updateSAPColourScales",
            payload: [DataType.ANC, testScales]
        });
        expect(testState.colourScales.anc).toBe(testScales);
    });

    it("updateSAPColourScales does nothgin if unknown DataType", () => {
        const testState = mockPlottingSelections();
        mutations.updateSAPColourScales(testState, {
            type: "updateSAPColourScales",
            payload: [99 as DataType, testScales]
        });
        expect(testState.colourScales.survey).toStrictEqual({});
        expect(testState.colourScales.program).toStrictEqual({});
        expect(testState.colourScales.anc).toStrictEqual({});
    });
});
