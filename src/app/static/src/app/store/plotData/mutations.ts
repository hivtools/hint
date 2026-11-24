import type { MutationTree } from "vuex";
import type { PlotData, PlotDataState } from "./plotData";
import type { PayloadWithType } from "../../types";
import type { PlotName } from "../plotSelections/plotSelections";

export enum PlotDataMutations {
    updatePlotData = "updatePlotData"
}

export type PlotDataUpdate = {
    plot: PlotName,
    data: PlotData
}

export const mutations: MutationTree<PlotDataState> = {
    [PlotDataMutations.updatePlotData](state: PlotDataState, action: PayloadWithType<PlotDataUpdate>) {
        state[action.payload.plot] = action.payload.data;
    }
};
