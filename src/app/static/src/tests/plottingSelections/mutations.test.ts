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
