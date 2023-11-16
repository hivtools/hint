import {actions} from "../../app/store/plottingSelections/actions";
import {PlottingSelectionsMutations} from "../../app/store/plottingSelections/mutations";
import {
    BarchartSelections,
} from "../../app/store/plottingSelections/plottingSelections";

describe("PlottingSelection actions", () => {
    beforeEach(() => {
        // stop apiService logging to console
        console.log = jest.fn();
    });

    afterEach(() => {
        (console.log as jest.Mock).mockClear();
    });

    it("fetchModelCalibrateOptions fetches options and commits mutations", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const barchartSelections = {
            indicatorId: "test-indicator",
            xAxisId: "age",
            disaggregateById: "test-disagg",
            selectedFilterOptions: {
                testFilter: []
            }
        } as BarchartSelections;

        await actions.updateBarchartSelections({commit, dispatch} as any, {payload: barchartSelections} as any);

        expect(dispatch.mock.calls.length).toBe(1);
        expect(dispatch.mock.calls[0][0]).toBe("modelCalibrate/getResultData");
        expect(dispatch.mock.calls[0][1]).toBe("test-indicator");

        expect(commit.mock.calls.length).toBe(1);
        expect(commit.mock.calls[0][0].type).toBe(PlottingSelectionsMutations.updateBarchartSelections);
        expect(commit.mock.calls[0][0].payload).toBe(barchartSelections);
    });
});
