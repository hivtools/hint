import {initialPlottingSelectionsState} from "../../app/store/plottingSelections/plottingSelections";
import {mutations} from "../../app/store/plottingSelections/mutations";

describe("Plotting selections mutations", () => {

    it("updates barchart selections", () => {
        const testState = {...initialPlottingSelectionsState};
        const newBarchartSelections = {
            indicatorId: "test-indicator",
            disaggregateById: "test-disagg",
            selectedFilterOptions: {
                testFilter: []
            }
        };
        mutations.updateBarchartSelections(testState, newBarchartSelections);

        expect(testState.barchart).toStrictEqual({
            indicatorId: "test-indicator",
            disaggregateById: "test-disagg",
            xAxisId: "",
            selectedFilterOptions: {
                testFilter: []
            }
        });
    });
});