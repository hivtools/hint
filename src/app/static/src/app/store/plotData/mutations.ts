import { MutationTree } from "vuex";
import { PlotData, PlotDataState } from "./plotData";
import { PayloadWithType } from "../../types";
import { PlotName } from "../plotSelections/plotSelections";

export enum PlotDataMutations {
    updatePlotData = "updatePlotData"
}

export type PlotDataUpdate = {
    plot: PlotName,
    data: PlotData
}

export const mutations: MutationTree<PlotDataState> = {
    [PlotDataMutations.updatePlotData](state: PlotDataState, action: PayloadWithType<PlotDataUpdate>) {
        console.log("setting plot data ", action.payload.plot, " to ", action.payload.data)
        state[action.payload.plot] = action.payload.data;
    }
};
