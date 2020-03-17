import {ActionContext, ActionTree} from "vuex";
import {RootState} from "../../root";
import {ColourScaleSelections, ColourScalesState} from "./colourScales";

export interface ColourScalesActions {
    updateSelectedSAPColourScales: (store: ActionContext<ColourScalesState, RootState>, colourScales: ColourScaleSelections) => void
}


export const actions: ActionTree<ColourScalesState, RootState> & ColourScalesActions = {
    updateSelectedSAPColourScales(context, colourScales) {
        const {commit, rootState} = context;
        commit({type: "UpdateSAPColourScales", payload: [rootState.surveyAndProgram.selectedDataType, colourScales]});
    }
};