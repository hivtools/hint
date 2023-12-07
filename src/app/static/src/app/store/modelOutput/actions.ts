import {ActionContext, ActionTree} from "vuex";
import {ModelOutputMutation} from "./mutations";
import {ModelOutputTabs} from "../../types";
import {DataExplorationState} from "../dataExploration/dataExploration";
import {ModelOutputState} from "./modelOutput";
import { ResultDataPayload } from "../modelCalibrate/actions";

export interface ModelOutputActions {
    updateSelectedTab: (store: ActionContext<ModelOutputState, DataExplorationState>, tab: ModelOutputTabs) => void
}

export const actions: ActionTree<ModelOutputState, DataExplorationState> & ModelOutputActions = {

    async updateSelectedTab(context, tab) {
        const {commit, rootState, dispatch} = context;

        const currentIndicatorPayloads: ResultDataPayload[] = [];
        switch (tab) {
            case ModelOutputTabs.Bar:
                currentIndicatorPayloads.push({
                    tab,
                    payload: { indicatorId: rootState.plottingSelections.barchart.indicatorId }
                });
                break;
            case ModelOutputTabs.Bubble:
                currentIndicatorPayloads.push({
                    tab,
                    payload: { colorIndicatorId: rootState.plottingSelections.bubble.colorIndicatorId }
                });
                currentIndicatorPayloads.push({
                    tab,
                    payload: { sizeIndicatorId: rootState.plottingSelections.bubble.sizeIndicatorId }
                });
                break;
            case ModelOutputTabs.Comparison:
                // Comparison plot data is fetched separately immediately after calibration is complete
                // We don't need to retrieve slices of it here.
                break;
            case ModelOutputTabs.Map:
                currentIndicatorPayloads.push({
                    tab,
                    payload: { indicatorId: rootState.plottingSelections.outputChoropleth.indicatorId }
                });
                break;
            case ModelOutputTabs.Table:
                currentIndicatorPayloads.push({
                    tab,
                    payload: { indicator: rootState.plottingSelections.table.indicator }
                });
                break;
            default:
                break;
        }

        currentIndicatorPayloads.forEach(payload => {
            dispatch("modelCalibrate/getResultData", payload, {root:true});
        });
        commit({type: ModelOutputMutation.TabSelected, payload: tab});
    },
};
