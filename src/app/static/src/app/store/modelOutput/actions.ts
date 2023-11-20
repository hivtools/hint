import {ActionContext, ActionTree} from "vuex";
import {ModelOutputMutation} from "./mutations";
import {ModelOutputTabs} from "../../types";
import {DataExplorationState} from "../dataExploration/dataExploration";
import {ModelOutputState} from "./modelOutput";

export interface ModelOutputActions {
    updateSelectedTab: (store: ActionContext<ModelOutputState, DataExplorationState>, tab: ModelOutputTabs) => void
}

export const actions: ActionTree<ModelOutputState, DataExplorationState> & ModelOutputActions = {

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
                currentIndicators.push(rootState.plottingSelections.comparisonPlot.indicatorId);
                break;
            case ModelOutputTabs.Map:
                currentIndicators.push(rootState.plottingSelections.outputChoropleth.indicatorId);
                break;
            case ModelOutputTabs.Table:
                // TODO: Add table selections here
                break;
            default:
                break;
        }

        currentIndicators.forEach(indicator => dispatch("modelCalibrate/getResultData", indicator, {root:true}));
        commit({type: ModelOutputMutation.TabSelected, payload: tab});
    },
};
