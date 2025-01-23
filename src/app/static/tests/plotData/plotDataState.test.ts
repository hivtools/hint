import {plotData, PlotDataState} from "../../src/store/plotData/plotData";
import {plotNames} from "../../src/store/plotSelections/plotSelections";

it("loads initial state", () => {
    const state = plotData.state as PlotDataState;
    const names = Object.keys(state);
    expect(names).toStrictEqual(plotNames);
});
