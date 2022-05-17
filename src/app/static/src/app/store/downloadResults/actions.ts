import {ActionContext, ActionTree, Dispatch} from "vuex";
import {RootState} from "../../root";
import {DownloadResultsState} from "./downloadResults";
import {api, ResponseWithType} from "../../apiService";
import {DownloadResultsMutation} from "./mutations";
import {ModelStatusResponse} from "../../generated";
import {DOWNLOAD_TYPE} from "../../types";
import {switches} from "../../featureSwitches"

export interface DownloadResultsActions {
    prepareSummaryReport: (store: ActionContext<DownloadResultsState, RootState>) => void
    prepareSpectrumOutput: (store: ActionContext<DownloadResultsState, RootState>) => void
    prepareCoarseOutput: (store: ActionContext<DownloadResultsState, RootState>) => void
    prepareComparisonOutput: (store: ActionContext<DownloadResultsState, RootState>) => void
    prepareOutputs: (store: ActionContext<DownloadResultsState, RootState>) => void
    poll: (store: ActionContext<DownloadResultsState, RootState>, downloadType: string) => void
}

export const actions: ActionTree<DownloadResultsState, RootState> & DownloadResultsActions = {

    async prepareOutputs(context) {
        const {dispatch} = context
        await Promise.all([
            dispatch("prepareCoarseOutput"),
            dispatch("prepareSummaryReport"),
            dispatch("prepareSpectrumOutput"),
            dispatch("prepareComparisonOutput")
        ]);
    },

    async prepareCoarseOutput(context) {
        const {state, dispatch, rootState, commit} = context
        console.log("fetchingDownloadId 1", state.coarseOutput.fetchingDownloadId, state.coarseOutput)
        if (!state.coarseOutput.downloadId && !state.coarseOutput.fetchingDownloadId) {
            commit({type: "SetFetchingDownloadId", payload: DOWNLOAD_TYPE.COARSE});
            console.log("fetchingDownloadId 2", state.coarseOutput.fetchingDownloadId, state.coarseOutput)
            const calibrateId = rootState.modelCalibrate.calibrateId
            const response = await api<DownloadResultsMutation, DownloadResultsMutation>(context)
                .withSuccess(DownloadResultsMutation.PreparingCoarseOutput)
                .withError(DownloadResultsMutation.CoarseOutputError)
                .get(`download/submit/coarse-output/${calibrateId}`)
            console.log("fetchingDownloadId 3", state.coarseOutput.fetchingDownloadId, state.coarseOutput)

            if (response) {
                await dispatch("poll", DOWNLOAD_TYPE.COARSE)
            }
        }
    },

    async prepareSummaryReport(context) {
        const {state, dispatch, rootState, commit} = context
        if (!state.summary.downloadId && !state.summary.fetchingDownloadId) {
            commit({type: "SetFetchingDownloadId", payload: DOWNLOAD_TYPE.SUMMARY});
            const calibrateId = rootState.modelCalibrate.calibrateId
            const response = await api<DownloadResultsMutation, DownloadResultsMutation>(context)
                .withSuccess(DownloadResultsMutation.PreparingSummaryReport)
                .withError(DownloadResultsMutation.SummaryError)
                .get(`download/submit/summary/${calibrateId}`)

            if (response) {
                await dispatch("poll", DOWNLOAD_TYPE.SUMMARY)
            }
        }
    },

    async prepareSpectrumOutput(context) {
        const {dispatch, rootState, state, commit} = context
        if (!state.spectrum.downloadId && !state.spectrum.fetchingDownloadId) {
            commit({type: "SetFetchingDownloadId", payload: DOWNLOAD_TYPE.SPECTRUM});
            const calibrateId = rootState.modelCalibrate.calibrateId
            const response = await api<DownloadResultsMutation, DownloadResultsMutation>(context)
                .withSuccess(DownloadResultsMutation.PreparingSpectrumOutput)
                .withError(DownloadResultsMutation.SpectrumError)
                .get(`download/submit/spectrum/${calibrateId}`)

            if (response) {
                await dispatch("poll", DOWNLOAD_TYPE.SPECTRUM)
            }
        }
    },

    async prepareComparisonOutput(context) {
        const {state, dispatch, rootState, commit} = context
        if (!state.comparison.downloadId && switches.comparisonOutput && !state.comparison.fetchingDownloadId) {
            commit({type: "SetFetchingDownloadId", payload: DOWNLOAD_TYPE.COMPARISON});
            const calibrateId = rootState.modelCalibrate.calibrateId
            const response = await api<DownloadResultsMutation, DownloadResultsMutation>(context)
                .withSuccess(DownloadResultsMutation.PreparingComparisonOutput)
                .withError(DownloadResultsMutation.ComparisonError)
                .get(`download/submit/comparison/${calibrateId}`)

            if (response) {
                await dispatch("poll", DOWNLOAD_TYPE.COMPARISON)
            }
        }
    },

    async poll(context, downloadType) {
        const {commit} = context;
        const id = setInterval(() => {

            if (downloadType === DOWNLOAD_TYPE.SPECTRUM) {
                getSpectrumOutputStatus(context)
            } else if (downloadType === DOWNLOAD_TYPE.COARSE) {
                getCoarseOutputStatus(context)
            } else if (downloadType === DOWNLOAD_TYPE.SUMMARY) {
                getSummaryReportStatus(context)
            } else if (downloadType === DOWNLOAD_TYPE.COMPARISON) {
                getComparisonOutputStatus(context)
            }
        }, 2000);

        commit({type: "PollingStatusStarted", payload: {pollId: id, downloadType: downloadType}});
    },
};

export const getSummaryReportStatus = async function (context: ActionContext<DownloadResultsState, RootState>): Promise<void> {
    const {state, dispatch} = context;
    // if (state.summary.statusPollId !== -1){
        const downloadId = state.summary.downloadId;
        const response = await api<DownloadResultsMutation, DownloadResultsMutation>(context)
            .withSuccess(DownloadResultsMutation.SummaryReportStatusUpdated)
            .withError(DownloadResultsMutation.SummaryError)
            .get<ModelStatusResponse>(`download/status/${downloadId}`)
        await getADRUploadMetadata(response, dispatch);
    // }
};

export const getSpectrumOutputStatus = async function (context: ActionContext<DownloadResultsState, RootState>): Promise<void> {
    const {state, dispatch} = context;
    // if (state.spectrum.statusPollId !== -1){
        const downloadId = state.spectrum.downloadId;
        const response = await api<DownloadResultsMutation, DownloadResultsMutation>(context)
            .withSuccess(DownloadResultsMutation.SpectrumOutputStatusUpdated)
            .withError(DownloadResultsMutation.SpectrumError)
            .get<ModelStatusResponse>(`download/status/${downloadId}`);
        await getADRUploadMetadata(response, dispatch);
    // }
};

export const getCoarseOutputStatus = async function (context: ActionContext<DownloadResultsState, RootState>): Promise<void> {
    const {state, dispatch} = context;
    // if (state.coarseOutput.statusPollId !== -1){
        const downloadId = state.coarseOutput.downloadId;
        const response = await api<DownloadResultsMutation, DownloadResultsMutation>(context)
            .withSuccess(DownloadResultsMutation.CoarseOutputStatusUpdated)
            .withError(DownloadResultsMutation.CoarseOutputError)
            .get<ModelStatusResponse>(`download/status/${downloadId}`);
        await getADRUploadMetadata(response, dispatch);
    // }
};

export const getComparisonOutputStatus = async function (context: ActionContext<DownloadResultsState, RootState>): Promise<void> {
    const {state, dispatch} = context;
    // if (state.comparison.statusPollId !== -1){
        const downloadId = state.comparison.downloadId;
        const response = await api<DownloadResultsMutation, DownloadResultsMutation>(context)
            .withSuccess(DownloadResultsMutation.ComparisonOutputStatusUpdated)
            .withError(DownloadResultsMutation.ComparisonError)
            .get<ModelStatusResponse>(`download/status/${downloadId}`);
        await getADRUploadMetadata(response, dispatch);
    // }
};

const getADRUploadMetadata = async function(response: void | ResponseWithType<ModelStatusResponse>, dispatch: Dispatch) {
    if (response && response.data?.done) {
        await dispatch("metadata/getAdrUploadMetadata", response.data.id, {root: true});
    }
}
