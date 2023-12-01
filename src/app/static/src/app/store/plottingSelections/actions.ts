import {ActionContext, ActionTree} from "vuex";
import {PlottingSelectionsMutations} from "./mutations";
import {
    BarchartSelections, BubblePlotSelections, ChoroplethSelections,
    PlottingSelectionsState,
    TableSelections
} from "./plottingSelections";
import {ModelOutputTabs, PayloadWithType} from "../../types";
import {DataExplorationState} from "../dataExploration/dataExploration";

export interface PlottingSelectionsActions {
    updateBarchartSelections: (store: ActionContext<PlottingSelectionsState, DataExplorationState>, payload: PayloadWithType<BarchartSelections>) => void
    updateChoroplethSelections: (store: ActionContext<PlottingSelectionsState, DataExplorationState>, payload: PayloadWithType<Partial<ChoroplethSelections>>) => void
    updateBubblePlotSelections: (store: ActionContext<PlottingSelectionsState, DataExplorationState>, payload: PayloadWithType<Partial<BubblePlotSelections>>) => void
    updateTableSelections: (store: ActionContext<PlottingSelectionsState, DataExplorationState>, payload: PayloadWithType<Partial<TableSelections>>) => void
}

export const actions: ActionTree<PlottingSelectionsState, DataExplorationState> & PlottingSelectionsActions = {

    async updateBarchartSelections(context, payload) {
        const {commit, dispatch} = context;
        const indicatorId = payload.payload.indicatorId;
        commit({type: PlottingSelectionsMutations.updateBarchartSelections, payload: payload.payload});
        await dispatch("modelCalibrate/getResultData", indicatorId, {root:true});
    },

    async updateChoroplethSelections(context, payload) {
        const {commit, dispatch} = context;
        const indicatorId = payload.payload.indicatorId;
        commit({type: PlottingSelectionsMutations.updateOutputChoroplethSelections, payload: payload.payload});
        if (indicatorId) await dispatch("modelCalibrate/getResultData", indicatorId, {root:true});
    },

    async updateBubblePlotSelections(context, payload) {
        const {commit, dispatch} = context;
        const colourIndicatorId = payload.payload.colorIndicatorId;
        const sizeIndicatorId = payload.payload.sizeIndicatorId;
        commit({type: PlottingSelectionsMutations.updateBubblePlotSelections, payload: payload.payload});
        if (colourIndicatorId) await dispatch("modelCalibrate/getResultData", colourIndicatorId, {root:true});
        if (sizeIndicatorId) await dispatch("modelCalibrate/getResultData", sizeIndicatorId, {root:true});
    },

    async updateTableSelections(context, payload) {
        const {commit, dispatch} = context;
        const indicatorId = payload.payload.indicator;
        commit({type: PlottingSelectionsMutations.updateTableSelections, payload: payload.payload});
        if (indicatorId) await dispatch("modelCalibrate/getResultData", indicatorId, {root:true});
    }
};
