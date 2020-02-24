import {mutations} from "../../app/store/plottingSelections/mutations";
import {mockPlottingSelections} from "../mocks";

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
});
