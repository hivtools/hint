import {ActionContext, ActionTree} from "vuex";
import {PlottingSelectionsMutations} from "./mutations";
import {
    BarchartSelections,
    PlottingSelectionsState
} from "./plottingSelections";
import {PayloadWithType} from "../../types";
import {DataExplorationState} from "../dataExploration/dataExploration";

export interface PlottingSelectionsActions {
    updateBarchartSelections: (store: ActionContext<PlottingSelectionsState, DataExplorationState>, payload: PayloadWithType<BarchartSelections>) => void
}

export const actions: ActionTree<PlottingSelectionsState, DataExplorationState> & PlottingSelectionsActions = {

    async updateBarchartSelections(context, payload) {
        const {commit, dispatch} = context;
        const indicatorId = payload.payload.indicatorId;
        await dispatch("modelCalibrate/getResultData", indicatorId, {root:true});
        commit({type: PlottingSelectionsMutations.updateBarchartSelections, payload: payload.payload});
    }
};
