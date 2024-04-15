import { MutationTree } from "vuex";
import { PayloadWithType } from "../../types";
import {PlotState, ScaleSelections, ScaleSettings} from "./plotState";

export interface UpdateScale {
    indicatorId: string
    newScaleSettings: ScaleSettings
}

export enum PlotStateMutations {
    setOutputColourScales = "setOutputColourScales",
    updateOutputColourScales = "updateOutputColourScales",
    setOutputSizeScales = "setOutputSizeScales",
    updateOutputSizeScales = "updateOutputSizeScales"
}

export const mutations: MutationTree<PlotState> = {
    [PlotStateMutations.setOutputColourScales](state: PlotState, action: PayloadWithType<ScaleSelections>) {
        state.output.colourScales = action.payload;
    },
    [PlotStateMutations.updateOutputColourScales](state: PlotState, action: PayloadWithType<UpdateScale>) {
        const {indicatorId, newScaleSettings} = action.payload;
        const newColourScales = structuredClone(state.output.colourScales);
        newColourScales[indicatorId] = newScaleSettings;
        state.output.colourScales = newColourScales;
    },
    [PlotStateMutations.setOutputSizeScales](state: PlotState, action: PayloadWithType<ScaleSelections>) {
        state.output.sizeScales = action.payload;
    },
    [PlotStateMutations.updateOutputSizeScales](state: PlotState, action: PayloadWithType<UpdateScale>) {
        const {indicatorId, newScaleSettings} = action.payload;
        const newSizeScale = structuredClone(state.output.sizeScales);
        newSizeScale[indicatorId] = newScaleSettings;
        state.output.sizeScales = newSizeScale;
    },
};
