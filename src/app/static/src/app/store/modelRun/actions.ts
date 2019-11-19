import {ActionContext, ActionTree} from "vuex";
import {ModelRunState} from "./modelRun";
import {RootState} from "../../root";
import {api} from "../../apiService";
import {ModelResultResponse, ModelStatusResponse, ModelSubmitResponse} from "../../generated";

export type ModelRunActionTypes = "ModelRunStarted" | "RunStatusUpdated" | "PollingForStatusStarted" | "RunResultFetched"
export type ModelRunErrorTypes = "ModelRunError" | "RunStatusError" | "RunResultError"

export interface ModelRunActions {
    run: (store: ActionContext<ModelRunState, RootState>) => void
    poll: (store: ActionContext<ModelRunState, RootState>, runId: string) => void
    getResult: (store: ActionContext<ModelRunState, RootState>) => void
}

export const actions: ActionTree<ModelRunState, RootState> & ModelRunActions = {

    async run({commit, rootState}) {
        const options = rootState.modelOptions.options;
        options.sleep = 1; // TODO remove once no longer needed by hintr
        await api<ModelRunActionTypes, ModelRunErrorTypes>(commit)
            .withSuccess("ModelRunStarted")
            .withError("ModelRunError")
            .postAndReturn<ModelSubmitResponse>("/model/run/", options)
    },

    poll({commit, state, dispatch}, runId) {
        const id = setInterval(() => {
            api<ModelRunActionTypes, ModelRunErrorTypes>(commit)
                .withSuccess("RunStatusUpdated")
                .withError("RunStatusError")
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
            await api<ModelRunActionTypes, ModelRunErrorTypes>(commit)
                .withSuccess("RunResultFetched")
                .withError("RunResultError")
                .freezeResponse()
                .get<ModelResultResponse>(`/model/result/${state.modelRunId}`)
        }
        commit({type: "Ready", payload: true});
    }
};
