import { MutationTree } from "vuex";
import { PayloadWithType } from "../../types";
import {PlotState, ScaleSettings} from "./plotState";

export interface UpdateColourScale {
    indicatorId: string
    newScaleSettings: ScaleSettings
}

export enum PlotStateMutations {
    updateOutputColourScales = "updateOutputColourScales"
}

export const mutations: MutationTree<PlotState> = {
    [PlotStateMutations.updateOutputColourScales](state: PlotState, action: PayloadWithType<UpdateColourScale>) {
        console.log("Updating output colour scales", action.payload)
        const {indicatorId, newScaleSettings} = action.payload;
        const newColourScales = {...state.output.colourScales}
        newColourScales[indicatorId] = newScaleSettings
        state.output.colourScales = newColourScales;
    },
};
