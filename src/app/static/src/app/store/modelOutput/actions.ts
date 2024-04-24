import {ActionContext, ActionTree} from "vuex";
import {ModelOutputMutation} from "./mutations";
import {ModelOutputTabs} from "../../types";
import {ModelOutputState} from "./modelOutput";
import {RootState} from "../../root";

export interface ModelOutputActions {
    updateSelectedTab: (store: ActionContext<ModelOutputState, RootState>, tab: ModelOutputTabs) => void
}

export const actions: ActionTree<ModelOutputState, RootState> & ModelOutputActions = {

    async updateSelectedTab(context, tab) {
        const {commit, rootState, dispatch} = context;

        const currentIndicators: string[] = [];
        switch (tab) {
            case ModelOutputTabs.Bar:
                currentIndicators.push(rootState.plottingSelections.barchart.indicatorId);
                break;
            case ModelOutputTabs.Bubble:
                currentIndicators.push(rootState.plottingSelections.bubble.colorIndicatorId);
                currentIndicators.push(rootState.plottingSelections.bubble.sizeIndicatorId);
                break;
            case ModelOutputTabs.Comparison:
                // Comparison plot data is fetched separately immediately after calibration is complete
                // We don't need to retrieve slices of it here.
                break;
            case ModelOutputTabs.Map:
                currentIndicators.push(rootState.plottingSelections.outputChoropleth.indicatorId);
                break;
            case ModelOutputTabs.Table:
                currentIndicators.push(rootState.plottingSelections.table.indicator);
                break;
            default:
                break;
        }

        currentIndicators.forEach(indicator => {
            const payload = { indicatorId: indicator, tab };
            dispatch("modelCalibrate/getResultData", payload, {root:true});
        });
        commit({type: ModelOutputMutation.TabSelected, payload: tab});
    },
};
