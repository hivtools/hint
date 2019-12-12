import {ActionContext, ActionTree, Commit} from "vuex";
import {ModelRunState} from "./modelRun";
import {RootState} from "../../root";
import {api, APIService} from "../../apiService";
import {ModelResultResponse, ModelStatusResponse, ModelSubmitResponse} from "../../generated";
import {ModelRunMutation} from "./mutations";

export interface ModelRunActions {
    run: (store: ActionContext<ModelRunState, RootState>) => void
    poll: (store: ActionContext<ModelRunState, RootState>, runId: string) => void
    getResult: (store: ActionContext<ModelRunState, RootState>) => void
    cancelRun: (store: ActionContext<ModelRunState, RootState>) => void
}

export const actions: ActionTree<ModelRunState, RootState> & ModelRunActions = {

    async run(context) {
        const {commit, rootState} = context;
        const options = rootState.modelOptions.options;
        const version = rootState.modelOptions.version;
        await api<ModelRunMutation, ModelRunMutation>(context)
            .withSuccess(ModelRunMutation.ModelRunStarted)
            .withError(ModelRunMutation.ModelRunError)
            .postAndReturn<ModelSubmitResponse>("/model/run/", {options, version})
    },

    poll(context, runId) {
        const {commit, dispatch, state} = context;
        const id = setInterval(() => {
            api<ModelRunMutation, ModelRunMutation>(context)
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

    async getResult(context) {
        const {commit, state} = context;
        if (state.status.done) {
            await api<ModelRunMutation, ModelRunMutation>(context)
                .withSuccess(ModelRunMutation.RunResultFetched)
                .withError(ModelRunMutation.RunResultError)
                .freezeResponse()
                .get<ModelResultResponse>(`/model/result/${state.modelRunId}`)
                .then(() => {
                    if (state.result && state.result.plottingMetadata.barchart.defaults) {
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
    },

    async cancelRun(context) {
        const {commit, state} = context;
        const modelRunId = state.modelRunId;

        commit({type: "RunCancelled", payload: null});
        const apiService = api<ModelRunMutation, ModelRunMutation>(context)
                    .ignoreErrors();

        await makeCancelRunRequest(apiService,modelRunId)
    }
};

export async function makeCancelRunRequest(api: APIService<ModelRunMutation, ModelRunMutation>, modelRunId: string){
    return await api.postAndReturn<null>(`/model/cancel/${modelRunId}`);
}
