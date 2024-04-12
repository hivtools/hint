import { MutationTree } from "vuex";
import { PayloadWithType } from "../../types";
import {PlotState, ScaleSelections, ScaleSettings} from "./plotState";

export interface UpdateColourScale {
    indicatorId: string
    newScaleSettings: ScaleSettings
}

export enum PlotStateMutations {
    setOutputColourScales = "setOutputColourScales",
    updateOutputColourScales = "updateOutputColourScales"
}

export const mutations: MutationTree<PlotState> = {
    [PlotStateMutations.setOutputColourScales](state: PlotState, action: PayloadWithType<ScaleSelections>) {
        state.output.colourScales = action.payload;
    },
    [PlotStateMutations.updateOutputColourScales](state: PlotState, action: PayloadWithType<UpdateColourScale>) {
        const {indicatorId, newScaleSettings} = action.payload;
        const newColourScales = structuredClone(state.output.colourScales);
        newColourScales[indicatorId] = newScaleSettings;
        state.output.colourScales = newColourScales;
    },
};
