import {ActionContext, ActionTree} from "vuex";
import {ModelRunState} from "./modelRun";
import {RootState} from "../../root";
import {api} from "../../apiService";
import {ModelResultResponse, ModelStatusResponse, ModelSubmitResponse} from "../../generated";
import {Dict} from "../../types";

export type ModelRunActionTypes = "ModelRunStarted" | "RunStatusUpdated" | "PollingForStatusStarted" | "RunResultFetched"
export type ModelRunErrorTypes = "ModelRunError" | "RunStatusError" | "RunResultError"

export interface ModelRunActions {
    run: (store: ActionContext<ModelRunState, RootState>, options: Dict<string | string[]>) => void
    poll: (store: ActionContext<ModelRunState, RootState>, runId: string) => void
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
                .get<ModelResultResponse>(`/model/result/${state.modelRunId}`)
        }
        commit({type: "Ready", payload: true});
    }
};
