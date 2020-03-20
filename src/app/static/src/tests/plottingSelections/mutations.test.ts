import {mutations} from "../../app/store/plottingSelections/mutations";
import {mockColourScales, mockPlottingSelections} from "../mocks";
import {DataType} from "../../app/store/surveyAndProgram/surveyAndProgram";
import {ColourScaleType} from "../../app/store/plottingSelections/plottingSelections";

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
            selectedFilterOptions: { testFilter: [{id: "1", label: "one"}]}
        };
        mutations.updateBubblePlotSelections(testState, {payload: newBubbleSelections});
        expect(testState.bubble).toStrictEqual({
            colorIndicatorId: "",
            sizeIndicatorId: "",
            detail: -1,
            selectedFilterOptions: { testFilter: [{id: "1", label: "one"}]}
        });
    });

    it("updates SAP Choropleth selections", () => {
        const testState = mockPlottingSelections();
        const newChoroSelections = {
            selectedFilterOptions: { testFilter: [{id: "1", label: "one"}]}
        };
        mutations.updateSAPChoroplethSelections(testState, {payload: newChoroSelections});
        expect(testState.sapChoropleth).toStrictEqual({
            indicatorId: "",
            detail: -1,
            selectedFilterOptions: { testFilter: [{id: "1", label: "one"}]}
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

    const colourScales = {
        prevalence: {
            type: ColourScaleType.Default
        }
    };

    it("UpdateSAPColourScales updates colour scales correctly for survey", () => {
        const testState = mockPlottingSelections();
        mutations.UpdateSAPColourScales(testState, {type: "UpdateSAPColourScales",
            payload: [DataType.Survey, colourScales]
        });
        expect(testState.colourScales.survey).toBe(colourScales);
    });

    it("UpdateSAPColourScales updates colour scales correctly for program", () => {
        const testState = mockPlottingSelections();
        mutations.UpdateSAPColourScales(testState, {type: "UpdateSAPColourScales",
            payload: [DataType.Program, colourScales]
        });
        expect(testState.colourScales.program).toBe(colourScales);
    });

    it("UpdateSAPColourScales updates colour scales correctly for anc", () => {
        const testState = mockPlottingSelections();
        mutations.UpdateSAPColourScales(testState, {type: "UpdateSAPColourScales",
            payload: [DataType.ANC, colourScales]
        });
        expect(testState.colourScales.anc).toBe(colourScales);
    });

    it("UpdateSAPColourScales does nothgin if unknown DataType", () => {
        const testState = mockPlottingSelections();
        mutations.UpdateSAPColourScales(testState, {type: "UpdateSAPColourScales",
            payload: [99 as DataType, colourScales]
        });
        expect(testState.colourScales.survey).toStrictEqual({});
        expect(testState.colourScales.program).toStrictEqual({});
        expect(testState.colourScales.anc).toStrictEqual({});
    });
});
