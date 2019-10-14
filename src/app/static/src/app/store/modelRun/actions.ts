import {ActionContext, ActionTree, Dictionary} from "vuex";
import {ModelRunState} from "./modelRun";
import {RootState} from "../../root";
import {api} from "../../apiService";
import {ModelResultResponse, ModelStatusResponse, ModelSubmitResponse} from "../../generated";

export type ModelRunActionTypes = "ModelRunStarted" | "RunStatusUpdated" | "PollingForStatusStarted" | "RunResultFetched"
export type ModelRunErrorTypes = "ModelRunError" | "RunStatusError" | "RunResultError"

export interface ModelRunActions {
    run: (store: ActionContext<ModelRunState, RootState>, modelRunParams: Dictionary<any>) => void
    poll: (store: ActionContext<ModelRunState, RootState>, runId: number) => void
    getResult: (store: ActionContext<ModelRunState, RootState>) => void
}

export const actions: ActionTree<ModelRunState, RootState> & ModelRunActions = {

    async run({commit}, modelRunParams) {
        await api<ModelRunActionTypes, ModelRunErrorTypes>(commit)
            .withSuccess("ModelRunStarted")
            .withError("ModelRunError")
            .postAndReturn<ModelSubmitResponse>("/model/run/", modelRunParams)
    },

    poll({commit, state, dispatch}, runId) {
        const id = setInterval(() => {
            api<ModelRunActionTypes, ModelRunErrorTypes>(commit)
                .withSuccess("RunStatusUpdated")
                .withError("RunStatusError")
                .get<ModelStatusResponse>(`/model/status/${runId}`)
                .then(() => {
                    if (state.success) {
                        dispatch("getResult", runId);
                    }
                });
        }, 2000);

        commit({type: "PollingForStatusStarted", payload: id})
    },

    async getResult({commit, state}) {
        if (state.modelRunId && state.success) {
            await api<ModelRunActionTypes, ModelRunErrorTypes>(commit)
                .withSuccess("RunResultFetched")
                .withError("RunResultError")
                .get<ModelResultResponse>(`/model/result/${state.modelRunId}`)
        }
        commit({type: "Ready", payload: true});
    }
};
