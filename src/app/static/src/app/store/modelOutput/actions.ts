import {ActionContext, ActionTree} from "vuex";
import {ModelOutputMutation} from "./mutations";
import {Dict, ModelOutputTabs} from "../../types";
import {DataExplorationState} from "../dataExploration/dataExploration";
import {ModelOutputState} from "./modelOutput";
import { PayloadFilterOption, getData } from "../plottingSelections/actions";

export interface ModelOutputActions {
    updateSelectedTab: (store: ActionContext<ModelOutputState, DataExplorationState>, tab: ModelOutputTabs) => void
}

const isObjEmpty = (object: object) => {
    return Object.keys(object).length === 0;
};

export const actions: ActionTree<ModelOutputState, DataExplorationState> & ModelOutputActions = {

    async updateSelectedTab(context, tab) {
        const { commit, rootState } = context;
        commit({type: ModelOutputMutation.TabSelected, payload: tab});
        if (tab === ModelOutputTabs.Comparison) return;
        let filterSelections: Dict<PayloadFilterOption[]> = {};
        switch (tab) {
            case ModelOutputTabs.Bar:
                if (!isObjEmpty(rootState.plottingSelections.barchart.selectedFilterOptions)) {
                    filterSelections = {
                        indicator: [{id: rootState.plottingSelections.barchart.indicatorId}],
                        ...rootState.plottingSelections.barchart.selectedFilterOptions
                    };
                }
                break;
            case ModelOutputTabs.Bubble:
                if (!isObjEmpty(rootState.plottingSelections.bubble.selectedFilterOptions)) {
                    filterSelections = {
                        indicator: [
                            {id: rootState.plottingSelections.bubble.colorIndicatorId},
                            {id: rootState.plottingSelections.bubble.sizeIndicatorId}
                        ],
                        area_level: [{id: rootState.plottingSelections.bubble.detail}],
                        ...rootState.plottingSelections.bubble.selectedFilterOptions
                    };
                }
                break;
            case ModelOutputTabs.Map:
                if (!isObjEmpty(rootState.plottingSelections.outputChoropleth.selectedFilterOptions)) {
                    filterSelections = {
                        indicator: [{id: rootState.plottingSelections.outputChoropleth.indicatorId}],
                        area_level: [{id: rootState.plottingSelections.outputChoropleth.detail}],
                        ...rootState.plottingSelections.outputChoropleth.selectedFilterOptions
                    };
                }
                break;
            case ModelOutputTabs.Table:
                if (!isObjEmpty(rootState.plottingSelections.table.selectedFilterOptions)) {
                    filterSelections = {
                        indicator: [{id: rootState.plottingSelections.table.indicator}],
                        ...rootState.plottingSelections.table.selectedFilterOptions
                    };
                }
                break;
            default:
                break;
        }
        if (!isObjEmpty(filterSelections)) {
            await getData(context as any, filterSelections, tab);
        }
    },
};
