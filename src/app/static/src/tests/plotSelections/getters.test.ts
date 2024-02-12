import {ControlSelection, FilterSelection, plotSelectionsGetters} from "../../app/store/plotSelections/plotSelections";
import {mockPlotSelectionsState } from "../mocks";

describe("plotSelections getters", () => {

    const mockControlSelection: ControlSelection[] = [
        {
            id: "control1",
            label: "Control1",
            selection: []
        }
    ]
    const mockFilterSelection: FilterSelection[] = [
        {
            filterId: "filter1",
            stateFilterId: "stateFilter1",
            label: "Filter1",
            multiple: true,
            selection: []
        }
    ]
    const state = mockPlotSelectionsState({
        barchart: {
            controls: mockControlSelection,
            filters: mockFilterSelection
        }
    });

    it("gets plot controls", async () => {
        const result = plotSelectionsGetters.plotControls(state)("barchart");
        expect(result.length).toEqual(1);
        expect(result).toStrictEqual(mockControlSelection);
    });

    it("gets plot controls", async () => {
        const result = plotSelectionsGetters.outputFilters(state)("barchart");
        expect(result.length).toEqual(1);
        expect(result).toStrictEqual(mockFilterSelection);
    });
})
