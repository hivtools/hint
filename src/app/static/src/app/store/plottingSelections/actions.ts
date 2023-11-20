import {ActionContext, ActionTree} from "vuex";
import {PlottingSelectionsMutations} from "./mutations";
import {
    BarchartSelections, BubblePlotSelections, ChoroplethSelections,
    PlottingSelectionsState
} from "./plottingSelections";
import {PayloadWithType} from "../../types";
import {DataExplorationState} from "../dataExploration/dataExploration";

export interface PlottingSelectionsActions {
    updateBarchartSelections: (store: ActionContext<PlottingSelectionsState, DataExplorationState>, payload: PayloadWithType<BarchartSelections>) => void
    updateChoroplethSelections: (store: ActionContext<PlottingSelectionsState, DataExplorationState>, payload: PayloadWithType<Partial<ChoroplethSelections>>) => void
    updateBubblePlotSelections: (store: ActionContext<PlottingSelectionsState, DataExplorationState>, payload: PayloadWithType<Partial<BubblePlotSelections>>) => void
    updateComparisonPlotSelections: (store: ActionContext<PlottingSelectionsState, DataExplorationState>, payload: PayloadWithType<BarchartSelections>) => void
}

export const actions: ActionTree<PlottingSelectionsState, DataExplorationState> & PlottingSelectionsActions = {

    async updateBarchartSelections(context, payload) {
        const {commit, dispatch} = context;
        const indicatorId = payload.payload.indicatorId;
        await dispatch("modelCalibrate/getResultData", indicatorId, {root:true});
        commit({type: PlottingSelectionsMutations.updateBarchartSelections, payload: payload.payload});
    },

    async updateChoroplethSelections(context, payload) {
        const {commit, dispatch} = context;
        const indicatorId = payload.payload.indicatorId;
        if (indicatorId) await dispatch("modelCalibrate/getResultData", indicatorId, {root:true});
        commit({type: PlottingSelectionsMutations.updateOutputChoroplethSelections, payload: payload.payload});
    },

    async updateBubblePlotSelections(context, payload) {
        const {commit, dispatch} = context;
        const colourIndicatorId = payload.payload.colorIndicatorId;
        const sizeIndicatorId = payload.payload.sizeIndicatorId;
        if (colourIndicatorId) await dispatch("modelCalibrate/getResultData", colourIndicatorId, {root:true});
        if (sizeIndicatorId) await dispatch("modelCalibrate/getResultData", sizeIndicatorId, {root:true});
        commit({type: PlottingSelectionsMutations.updateBubblePlotSelections, payload: payload.payload});
    },

    async updateComparisonPlotSelections(context, payload) {
        const {commit, dispatch} = context;
        const indicatorId = payload.payload.indicatorId;
        await dispatch("modelCalibrate/getResultData", indicatorId, {root:true});
        commit({type: PlottingSelectionsMutations.updateComparisonPlotSelections, payload: payload.payload});
    }
};
