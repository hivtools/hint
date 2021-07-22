import {ActionContext, ActionTree, Dispatch} from "vuex";
import {RootState} from "../../root";
import {DownloadResultsState, DOWNLOAD_TYPE} from "./downloadResults";
import {api} from "../../apiService";
import {DownloadResultsMutation} from "./mutations";
import {ModelStatusResponse} from "../../generated";

export interface DownloadResultsActions {
    downloadSummary: (store : ActionContext<DownloadResultsState, RootState>) => void
    downloadSpectrum: (store : ActionContext<DownloadResultsState, RootState>) => void
    downloadCoarseOutput: (store : ActionContext<DownloadResultsState, RootState>) => void
    poll: (store: ActionContext<DownloadResultsState, RootState>, downloadType: string) => void
}

const getAdrUploadMeta = (dispatch: Dispatch, downloadId: string) => {
    dispatch("metadata/getAdrUploadMetadata", downloadId, {root: true})
}

export const actions: ActionTree<DownloadResultsState, RootState> & DownloadResultsActions = {

    async downloadCoarseOutput(context) {
        const {dispatch, rootState} = context
        const calibrateId = rootState.modelCalibrate.calibrateId

        const response = await api<DownloadResultsMutation, DownloadResultsMutation>(context)
            .withSuccess(DownloadResultsMutation.CoarseOutputDownloadStarted)
            .withError(DownloadResultsMutation.CoarseOutputError)
            .get(`download/submit/coarse-output/${calibrateId}`)

        if (response) {
            await dispatch("poll", DOWNLOAD_TYPE.COARSE)
        }
    },

    async downloadSummary(context) {
        const {dispatch, rootState} = context
        const calibrateId = rootState.modelCalibrate.calibrateId

        const response = await api<DownloadResultsMutation, DownloadResultsMutation>(context)
            .withSuccess(DownloadResultsMutation.SummaryDownloadStarted)
            .withError(DownloadResultsMutation.SummaryError)
            .get(`download/submit/summary/${calibrateId}`)

        if (response) {
            await dispatch("poll", DOWNLOAD_TYPE.SUMMARY)
        }
    },

    async downloadSpectrum(context) {
        const {dispatch, rootState} = context
        const calibrateId = rootState.modelCalibrate.calibrateId

        const response = await api<DownloadResultsMutation, DownloadResultsMutation>(context)
            .withSuccess(DownloadResultsMutation.SpectrumDownloadStarted)
            .withError(DownloadResultsMutation.SpectrumError)
            .get(`download/submit/spectrum/${calibrateId}`)

        if (response) {
            await dispatch("poll", DOWNLOAD_TYPE.SPECTRUM)
        }
    },

    async poll(context, downloadType) {
        const {commit} = context;
        const id = setInterval(() => {

            if(downloadType === DOWNLOAD_TYPE.SPECTRUM) {
                getSpectrumDownloadStatus(context)
            }
            else if(downloadType === DOWNLOAD_TYPE.COARSE) {
                getCoarseOutputDownloadStatus(context)
            }
            else if (downloadType === DOWNLOAD_TYPE.SUMMARY) {
                getSummaryDownloadStatus(context)
            }
            /*downloadType === DOWNLOAD_TYPE.SPECTRUM ? getSpectrumDownloadStatus(context)
                : downloadType === DOWNLOAD_TYPE.COARSE ? getCoarseOutputDownloadStatus(context)
                : getSummaryDownloadStatus(context)

             */
        }, 2000);

        commit({type: "PollingStatusStarted", payload: {pollId: id, downloadType: downloadType}});
    },
};

export const getSummaryDownloadStatus = async function (context: ActionContext<DownloadResultsState, RootState>) {
    const {commit, state, dispatch} = context;
    const downloadId = state.summary.downloadId;
    return api<DownloadResultsMutation, DownloadResultsMutation>(context)
        .withSuccess(DownloadResultsMutation.SummaryDownloadStatusUpdated)
        .withError(DownloadResultsMutation.SummaryError)
        .get<ModelStatusResponse>(`download/status/${downloadId}`)
        .then(() => {
            if (state.summary.status && state.summary.status.done) {
                getAdrUploadMeta(dispatch, downloadId)
                commit({type: DownloadResultsMutation.SummaryDownloadComplete, payload: true})
            }
        });
};

export const getSpectrumDownloadStatus = async function (context: ActionContext<DownloadResultsState, RootState>) {
    const {commit, state, dispatch} = context;
    const downloadId = state.spectrum.downloadId;
    return api<DownloadResultsMutation, DownloadResultsMutation>(context)
        .withSuccess(DownloadResultsMutation.SpectrumDownloadStatusUpdated)
        .withError(DownloadResultsMutation.SpectrumError)
        .get<ModelStatusResponse>(`download/status/${downloadId}`)
        .then(() => {
            if (state.spectrum.status && state.spectrum.status.done) {
                getAdrUploadMeta(dispatch, downloadId)
                commit({type: DownloadResultsMutation.SpectrumDownloadComplete, payload: true})
            }
        });
};

export const getCoarseOutputDownloadStatus = async function (context: ActionContext<DownloadResultsState, RootState>) {
    const {commit, state, dispatch} = context;
    const downloadId = state.coarseOutput.downloadId;
    return api<DownloadResultsMutation, DownloadResultsMutation>(context)
        .withSuccess(DownloadResultsMutation.CoarseOutputDownloadStatusUpdated)
        .withError(DownloadResultsMutation.CoarseOutputError)
        .get<ModelStatusResponse>(`download/status/${downloadId}`)
        .then(() => {
            if (state.coarseOutput.status && state.coarseOutput.status.done) {
                getAdrUploadMeta(dispatch, downloadId)
                commit({type: DownloadResultsMutation.CoarseOutputDownloadComplete, payload: true})
            }
        });
};