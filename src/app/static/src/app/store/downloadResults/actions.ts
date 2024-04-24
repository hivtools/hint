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
    prepareAgywTool: (store: ActionContext<DownloadResultsState, RootState>) => void
    prepareOutputs: (store: ActionContext<DownloadResultsState, RootState>) => void
    poll: (store: ActionContext<DownloadResultsState, RootState>, downloadType: string, interval?: number | null) => void
    downloadComparisonReport: (store: ActionContext<DownloadResultsState, RootState>) => void
    downloadSpectrumOutput: (store: ActionContext<DownloadResultsState, RootState>) => void
    downloadSummaryReport: (store: ActionContext<DownloadResultsState, RootState>) => void
    downloadCoarseOutput: (store: ActionContext<DownloadResultsState, RootState>) => void
    downloadAgywTool: (store: ActionContext<DownloadResultsState, RootState>) => void
}

export const actions: ActionTree<DownloadResultsState, RootState> & DownloadResultsActions = {

    async prepareOutputs(context) {
        const {dispatch} = context
        await Promise.all([
            dispatch("prepareCoarseOutput"),
            dispatch("prepareSummaryReport"),
            dispatch("prepareSpectrumOutput"),
            dispatch("prepareComparisonOutput"),
            ...switches.agywDownload ? [dispatch("prepareAgywTool")] : []
        ])
    },

    async downloadComparisonReport(context) {
        const {state, commit} = context
        commit({type: DownloadResultsMutation.ComparisonDownloadError, payload: null})
        await api(context)
            .ignoreSuccess()
            .withError(DownloadResultsMutation.ComparisonDownloadError)
            .download(`download/result/${state.comparison.downloadId}`)
    },

    async downloadSpectrumOutput(context) {
        const {state, commit} = context
        commit({type: DownloadResultsMutation.SpectrumOutputDownloadError, payload: null})
        await api(context)
            .ignoreSuccess()
            .withError(DownloadResultsMutation.SpectrumOutputDownloadError)
            .download(`download/result/${state.spectrum.downloadId}`)
    },

    async downloadSummaryReport(context) {
        const {state, commit} = context
        commit({type: DownloadResultsMutation.SummaryOutputDownloadError, payload: null})
        await api(context)
            .ignoreSuccess()
            .withError(DownloadResultsMutation.SummaryOutputDownloadError)
            .download(`download/result/${state.summary.downloadId}`)
    },

    async downloadCoarseOutput(context) {
        const {state, commit} = context
        commit({type: DownloadResultsMutation.CoarseOutputDownloadError, payload: null})
        await api(context)
            .ignoreSuccess()
            .withError(DownloadResultsMutation.CoarseOutputDownloadError)
            .download(`download/result/${state.coarseOutput.downloadId}`)
    },

    async downloadAgywTool(context) {
        const {state, commit} = context
        commit({type: DownloadResultsMutation.AgywDownloadError, payload: null})
        await api(context)
            .ignoreSuccess()
            .withError(DownloadResultsMutation.AgywDownloadError)
            .download(`download/result/${state.agyw.downloadId}`)
    },

    async prepareCoarseOutput(context) {
        const {state, dispatch, rootState, commit} = context
        if (!state.coarseOutput.downloadId && !state.coarseOutput.fetchingDownloadId) {
            commit({type: "SetFetchingDownloadId", payload: DOWNLOAD_TYPE.COARSE});
            const calibrateId = rootState.modelCalibrate.calibrateId
            const response = await api<DownloadResultsMutation, DownloadResultsMutation>(context)
                .withSuccess(DownloadResultsMutation.PreparingCoarseOutput)
                .withError(DownloadResultsMutation.CoarseOutputError)
                .postAndReturn(`download/submit/coarse-output/${calibrateId}`, {})

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
                .postAndReturn(`download/submit/summary/${calibrateId}`, {})

            if (response) {
                await dispatch("poll", DOWNLOAD_TYPE.SUMMARY)
            }
        }
    },

    async prepareSpectrumOutput(context) {
        const {dispatch, rootState, state, rootGetters, commit} = context
        if (!state.spectrum.downloadId && !state.spectrum.fetchingDownloadId) {
            commit({type: "SetFetchingDownloadId", payload: DOWNLOAD_TYPE.SPECTRUM});
            const calibrateId = rootState.modelCalibrate.calibrateId
            const response = await api<DownloadResultsMutation, DownloadResultsMutation>(context)
                .withSuccess(DownloadResultsMutation.PreparingSpectrumOutput)
                .withError(DownloadResultsMutation.SpectrumError)
                .postAndReturn(`download/submit/spectrum/${calibrateId}`, rootGetters.projectState)

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
                .postAndReturn(`download/submit/comparison/${calibrateId}`, {})

            if (response) {
                await dispatch("poll", DOWNLOAD_TYPE.COMPARISON)
            }
        }
    },

    async prepareAgywTool(context) {
        const {state, dispatch, rootState, commit} = context
        if (!state.agyw.downloadId && !state.agyw.fetchingDownloadId) {
            commit({type: "SetFetchingDownloadId", payload: DOWNLOAD_TYPE.AGYW});
            const calibrateId = rootState.modelCalibrate.calibrateId
            const response = await api<DownloadResultsMutation, DownloadResultsMutation>(context)
                .withSuccess(DownloadResultsMutation.PreparingAgywTool)
                .withError(DownloadResultsMutation.AgywError)
                .postAndReturn(`download/submit/agyw/${calibrateId}`, {})

            if (response) {
                await dispatch("poll", DOWNLOAD_TYPE.AGYW)
            }
        }
    },

    async poll(context, downloadType, interval = null) {
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
            } else if (downloadType === DOWNLOAD_TYPE.AGYW) {
                getAgywDownloadStatus(context)
            }
        }, interval || 2000);

        commit({type: "PollingStatusStarted", payload: {pollId: id, downloadType: downloadType}});
    },
};

export const getSummaryReportStatus = async function (context: ActionContext<DownloadResultsState, RootState>): Promise<void> {
    const {state, dispatch, rootState, commit} = context;
    const downloadId = state.summary.downloadId;
    const response = await api<DownloadResultsMutation, DownloadResultsMutation>(context)
        .withSuccess(DownloadResultsMutation.SummaryReportStatusUpdated)
        .withError(DownloadResultsMutation.SummaryError)
        .get<ModelStatusResponse>(`download/status/${downloadId}`)

    if (response && response.data?.done) {
        await getADRUploadMetadata(response, dispatch).then(() => {
            // commit is neccessary for dispatching action
            // to retrieve metadata for summary report
            commit({
                type: DownloadResultsMutation.SummaryMetadataError,
                payload: rootState.metadata.adrUploadMetadataError
            });
        });
    }
};

export const getSpectrumOutputStatus = async function (context: ActionContext<DownloadResultsState, RootState>): Promise<void> {
    const {state, dispatch, rootState, commit} = context;
    const downloadId = state.spectrum.downloadId;
    const response = await api<DownloadResultsMutation, DownloadResultsMutation>(context)
        .withSuccess(DownloadResultsMutation.SpectrumOutputStatusUpdated)
        .withError(DownloadResultsMutation.SpectrumError)
        .get<ModelStatusResponse>(`download/status/${downloadId}`);

    if (response && response.data?.done) {
        await getADRUploadMetadata(response, dispatch).then(() => {
            // commit is neccessary for dispatching action
            // to retrieve metadata for spectrum report
            commit({
                type: DownloadResultsMutation.SpectrumMetadataError,
                payload: rootState.metadata.adrUploadMetadataError
            });
        });
    }
};

export const getCoarseOutputStatus = async function (context: ActionContext<DownloadResultsState, RootState>): Promise<void> {
    const {state, dispatch, rootState, commit} = context;
    const downloadId = state.coarseOutput.downloadId;
    const response = await api<DownloadResultsMutation, DownloadResultsMutation>(context)
        .withSuccess(DownloadResultsMutation.CoarseOutputStatusUpdated)
        .withError(DownloadResultsMutation.CoarseOutputError)
        .get<ModelStatusResponse>(`download/status/${downloadId}`);

    if (response && response.data?.done) {
        await getADRUploadMetadata(response, dispatch).then(() => {
            // commit is neccessary for dispatching action
            // to retrieve metadata for coarseOutput report
            commit({
                type: DownloadResultsMutation.CoarseOutputMetadataError,
                payload: rootState.metadata.adrUploadMetadataError
            });
        });
    }
};

export const getComparisonOutputStatus = async function (context: ActionContext<DownloadResultsState, RootState>): Promise<void> {
    const {state, dispatch, rootState, commit} = context;
    const downloadId = state.comparison.downloadId;
    const response = await api<DownloadResultsMutation, DownloadResultsMutation>(context)
        .withSuccess(DownloadResultsMutation.ComparisonOutputStatusUpdated)
        .withError(DownloadResultsMutation.ComparisonError)
        .get<ModelStatusResponse>(`download/status/${downloadId}`);

    if (response && response.data?.done) {
        await getADRUploadMetadata(response, dispatch).then(() => {
            // commit is neccessary for dispatching action
            // to retrieve metadata for comparison report
            commit({
                type: DownloadResultsMutation.ComparisonOutputMetadataError,
                payload: rootState.metadata.adrUploadMetadataError
            });
        });
    }
};

export const getAgywDownloadStatus = async function (context: ActionContext<DownloadResultsState, RootState>): Promise<void> {
    const {state} = context;
    const downloadId = state.agyw.downloadId;
    await api<DownloadResultsMutation, DownloadResultsMutation>(context)
        .withSuccess(DownloadResultsMutation.AgywStatusUpdated)
        .withError(DownloadResultsMutation.AgywError)
        .get<ModelStatusResponse>(`download/status/${downloadId}`);
};

const getADRUploadMetadata = async function (response: ResponseWithType<ModelStatusResponse>, dispatch: Dispatch) {
        await dispatch("metadata/getAdrUploadMetadata", response.data.id, {root: true});
}
