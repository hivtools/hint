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
        const { dispatch } = context;
        const tab = ModelOutputTabs.Bar;
        const resultDataPayload = { payload: payload.payload, tab };
        await dispatch("modelCalibrate/getResultData", resultDataPayload, {root:true});
    },

    async updateChoroplethSelections(context, payload) {
        const { dispatch } = context;
        const tab = ModelOutputTabs.Map;
        const resultDataPayload = { payload: payload.payload, tab };
        dispatch("modelCalibrate/getResultData", resultDataPayload, {root:true});
    },

    async updateBubblePlotSelections(context, payload) {
        const { dispatch } = context;
        const tab = ModelOutputTabs.Bubble;
        const resultDataPayload = { payload: payload.payload, tab };
        await dispatch("modelCalibrate/getResultData", resultDataPayload, {root:true});
    },

    async updateTableSelections(context, payload) {
        const { dispatch } = context;
        const tab = ModelOutputTabs.Table;
        const resultDataPayload = { payload: payload.payload, tab };
        await dispatch("modelCalibrate/getResultData", resultDataPayload, {root:true});
    }
};
