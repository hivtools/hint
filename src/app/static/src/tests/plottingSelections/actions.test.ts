import {actions} from "../../app/store/plottingSelections/actions";
import {PlottingSelectionsMutations} from "../../app/store/plottingSelections/mutations";
import {
    BarchartSelections, BubblePlotSelections, ChoroplethSelections, TableSelections,
} from "../../app/store/plottingSelections/plottingSelections";
import { ModelOutputTabs } from "../../app/types";

describe("PlottingSelection actions", () => {

    it("updateBarchartSelections dispatches data action and commits mutation", async () => {
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
        expect(dispatch.mock.calls[0][1]).toStrictEqual({payload: barchartSelections, tab: ModelOutputTabs.Bar})
    });

    it("updateChoroplethSelections dispatches data action and commits mutation", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const choroplethSelections = {
            indicatorId: "test-indicator",
        } as Partial<ChoroplethSelections>;

        await actions.updateChoroplethSelections({commit, dispatch} as any, {payload: choroplethSelections} as any);

        expect(dispatch.mock.calls.length).toBe(1);
        expect(dispatch.mock.calls[0][0]).toBe("modelCalibrate/getResultData");
        expect(dispatch.mock.calls[0][1]).toStrictEqual({payload: choroplethSelections, tab: ModelOutputTabs.Map})
    });

    it("updateTableSelection dispatches data action and commits mutation", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const tableSelections = {
            indicator: "test-indicator",
        } as Partial<TableSelections>;

        await actions.updateTableSelections({commit, dispatch} as any, {payload: tableSelections} as any);

        expect(dispatch.mock.calls.length).toBe(1);
        expect(dispatch.mock.calls[0][0]).toBe("modelCalibrate/getResultData");
        expect(dispatch.mock.calls[0][1]).toStrictEqual({payload: tableSelections, tab: ModelOutputTabs.Table})
    });

    it("updateBubblePlotSelections dispatches data action and commits mutation", async () => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const bubbleSelections = {
            colorIndicatorId: "colour-indicator",
            sizeIndicatorId: "size-indicator"
        } as Partial<BubblePlotSelections>;

        await actions.updateBubblePlotSelections({commit, dispatch} as any, {payload: bubbleSelections} as any);

        expect(dispatch.mock.calls.length).toBe(1);
        expect(dispatch.mock.calls[0][0]).toBe("modelCalibrate/getResultData");
        expect(dispatch.mock.calls[0][1]).toStrictEqual({payload: bubbleSelections, tab: ModelOutputTabs.Bubble})
    });
});
