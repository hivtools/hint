import {ActionContext, ActionTree} from "vuex";
import {RootState} from "../../root";
import {DownloadResultsState} from "./downloadResults";
import {api} from "../../apiService";
import {DownloadResultsMutation} from "./mutations";
import {ModelStatusResponse} from "../../generated";

export interface DownloadResultsActions {
    download: (store : ActionContext<DownloadResultsState, RootState>, type: String) => void
    poll: (store: ActionContext<DownloadResultsState, RootState>) => void
}

export const actions: ActionTree<DownloadResultsState, RootState> & DownloadResultsActions = {

    async download(context, type) {
        const {dispatch, rootState} = context
        const calibrateId = rootState.modelCalibrate.calibrateId

        const response = await api<DownloadResultsMutation, DownloadResultsMutation>(context)
            .withSuccess(DownloadResultsMutation.DownloadStarted)
            .withError(DownloadResultsMutation.DownloadError)
            .get(`download/submit/${type}/${calibrateId}`)

        if (response) {
            await dispatch("poll")
        }
    },

    async poll(context) {
        const {commit} = context;
        const id = setInterval(() => {
            getDownloadStatus(context);
        }, 2000);

        commit({type: "PollingStatusStarted", payload: id});
    },
};

export const getDownloadStatus = async function (context: ActionContext<DownloadResultsState, RootState>) {
    const {commit, state} = context;
    const downloadId = state.downloadId;
    return api<DownloadResultsMutation, DownloadResultsMutation>(context)
        .withSuccess(DownloadResultsMutation.DownloadStatusUpdated)
        .withError(DownloadResultsMutation.DownloadError)
        .get<ModelStatusResponse>(`download/status/${downloadId}`)
        .then(() => {
            if (state.status && state.status.done) {
                window.location.href = `/download/result/${state.downloadId}`
                commit({type: DownloadResultsMutation.DownloadComplete, payload: true})
            }
        });
};