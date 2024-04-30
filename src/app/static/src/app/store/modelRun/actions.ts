import {ActionContext, ActionTree} from "vuex";
import {ModelRunState} from "./modelRun";
import {RootState} from "../../root";
import {api, APIService} from "../../apiService";
import {ModelResultResponse, ModelStatusResponse, ModelSubmitResponse} from "../../generated";
import {ModelRunMutation} from "./mutations";

export interface ModelRunActions {
    run: (store: ActionContext<ModelRunState, RootState>) => void
    poll: (store: ActionContext<ModelRunState, RootState>, runId: string, interval?: number | null) => void
    getResult: (store: ActionContext<ModelRunState, RootState>) => void
    cancelRun: (store: ActionContext<ModelRunState, RootState>) => void
}

export const actions: ActionTree<ModelRunState, RootState> & ModelRunActions = {

    async run(context) {
        const {commit, rootState, state} = context;
        commit({type: ModelRunMutation.StartedRunning, payload: true})
        const options = rootState.modelOptions.options;
        const version = rootState.modelOptions.version;
        if (state.statusPollId !== -1) {
            commit(ModelRunMutation.RunCancelled);
        }
        await api<ModelRunMutation, ModelRunMutation>(context)
            .withSuccess(ModelRunMutation.ModelRunStarted)
            .withError(ModelRunMutation.ModelRunError)
            .postAndReturn<ModelSubmitResponse>("/model/run/", {options, version})
    },

    poll(context, runId, interval = null) {
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
        }, interval || 2000);

        commit({type: "PollingForStatusStarted", payload: id})
    },

    async getResult(context) {
        const {commit, state} = context;
        if (state.status.done) {
            const response = await api<ModelRunMutation, ModelRunMutation>(context)
                .ignoreSuccess()
                .withError(ModelRunMutation.RunResultError)
                .freezeResponse()
                .get<ModelResultResponse>(`/model/result/${state.modelRunId}`);

            if (response) {
                commit({type: ModelRunMutation.WarningsFetched, payload: response.data.warnings});
                commit({type: ModelRunMutation.RunResultFetched, payload: response.data});
            }
            commit({type: ModelRunMutation.StartedRunning, payload: false})
        }
        commit({type: "Ready", payload: true});
    },

    async cancelRun(context) {
        const {commit, state} = context;
        const modelRunId = state.modelRunId;

        commit({type: "RunCancelled", payload: null});
        const apiService = api<ModelRunMutation, ModelRunMutation>(context)
            .ignoreSuccess()
            .ignoreErrors();

        await makeCancelRunRequest(apiService, modelRunId)
    }
};

export async function makeCancelRunRequest(api: APIService<ModelRunMutation, ModelRunMutation>, modelRunId: string) {
    return await api.postAndReturn<null>(`/model/cancel/${modelRunId}`);
}
