import {ActionContext, ActionTree} from "vuex";
import {ModelRunState} from "./modelRun";
import {RootState} from "../../root";
import {api} from "../../apiService";
import {ModelResultResponse, ModelStatusResponse, ModelSubmitResponse} from "../../generated";
import {ModelRunMutation} from "./mutations";
import {PlottingSelectionsMutations} from "../plottingSelections/mutations";

export interface ModelRunActions {
    run: (store: ActionContext<ModelRunState, RootState>) => void
    poll: (store: ActionContext<ModelRunState, RootState>, runId: string) => void
    getResult: (store: ActionContext<ModelRunState, RootState>) => void
}

export const actions: ActionTree<ModelRunState, RootState> & ModelRunActions = {

    async run({commit, rootState}) {
        const options = rootState.modelOptions.options;
        const version = rootState.modelOptions.version;
        await api<ModelRunMutation, ModelRunMutation>(commit)
            .withSuccess(ModelRunMutation.ModelRunStarted)
            .withError(ModelRunMutation.ModelRunError)
            .postAndReturn<ModelSubmitResponse>("/model/run/", {options, version})
    },

    poll({commit, state, dispatch}, runId) {
        const id = setInterval(() => {
            api<ModelRunMutation, ModelRunMutation>(commit)
                .withSuccess(ModelRunMutation.RunStatusUpdated)
                .withError(ModelRunMutation.RunStatusError)
                .get<ModelStatusResponse>(`/model/status/${runId}`)
                .then(() => {
                    if (state.status.done) {
                        dispatch("getResult", runId);
                    }
                });
        }, 2000);

        commit({type: "PollingForStatusStarted", payload: id})
    },

    async getResult({commit, state}) {
        if (state.status.done) {
            await api<ModelRunMutation, ModelRunMutation>(commit)
                .withSuccess(ModelRunMutation.RunResultFetched)
                .withError(ModelRunMutation.RunResultError)
                .freezeResponse()
                .get<ModelResultResponse>(`/model/result/${state.modelRunId}`)
                .then(() => {
                    console.log("GOT MODEL RESULT");
                    if (state.result && state.result.plottingMetadata.barchart.defaults) {
                        console.log("UPDATING PLOTTING METADATA WITH DEFAULTS");
                        const defaults = state.result.plottingMetadata.barchart.defaults;
                        commit({
                                type: "plottingSelections/updateBarchartSelections",
                                payload: {
                                    indicatorId: defaults.indicator_id,
                                    xAxisId: defaults.x_axis_id,
                                    disaggregateById: defaults.disaggregate_by_id,
                                    selectedFilterOptions: {...defaults.selected_filter_options}
                                }
                            },
                            {root: true});
                    }
                });
        }
        commit({type: "Ready", payload: true});
    }
};
