import {ActionContext, ActionTree, Dispatch} from "vuex";
import {RootState} from "../../root";
import {DownloadResultsState} from "./downloadResults";
import {api, ResponseWithType} from "../../apiService";
import {DownloadResultsMutation} from "./mutations";
import {Error, ModelStatusResponse} from "../../generated";
import {switches} from "../../featureSwitches"
import { DownloadType, downloadTypePrepareUrls } from "./downloadConfig";

export interface DownloadResultsActions {
    prepareAllOutputs: (store: ActionContext<DownloadResultsState, RootState>) => Promise<void>
    prepareOutput: (store: ActionContext<DownloadResultsState, RootState>, type: DownloadType) => Promise<void>
    downloadOutput: (store: ActionContext<DownloadResultsState, RootState>, type: DownloadType) => Promise<void>
    poll: (store: ActionContext<DownloadResultsState, RootState>, type: DownloadType, interval?: number | null) => Promise<void>
}

const payloadHandler = (type: DownloadType) => {
    return (payload: any) => ({ type, payload });
};

export const actions: ActionTree<DownloadResultsState, RootState> & DownloadResultsActions = {
    async prepareAllOutputs({ dispatch }) {
        Object.values(DownloadType).forEach(type => {
            if (type === DownloadType.AGYW && !switches.agywDownload) return;
            dispatch("prepareOutput", type);
        });
    },

    async prepareOutput(store, type) {
        const { state, dispatch, rootState, commit } = store;
        if (state[type].downloadId || state[type].fetchingDownloadId) return;
        commit({ type: DownloadResultsMutation.SetFetchingDownloadId, payload: type });
        const postConfig = downloadTypePrepareUrls[type];
        const fullUrl = `download/submit/${postConfig.url}/${rootState.modelCalibrate.calibrateId}`;

        const response = await api(store)
            .withSuccess(DownloadResultsMutation.Preparing, false, payloadHandler(type))
            .withError(DownloadResultsMutation.Error, false, payloadHandler(type))
            .postAndReturn(fullUrl, postConfig.body(store));
        if (response) {
            await dispatch("poll", type);
        }
    },

    async downloadOutput(store, type) {
        const { state, commit } = store
        const payload = { type, payload: null };
        commit({type: DownloadResultsMutation.DownloadError, payload })
        await api(store)
            .ignoreSuccess()
            .withError(DownloadResultsMutation.DownloadError, false, payloadHandler(type))
            .download(`download/result/${state[type].downloadId}`)
    },

    async poll(store, type, interval = null) {
        const { commit } = store;
        const pollId = setInterval(
            () => getDownloadStatus(store, type),
            interval || 2000
        );
        const payload = { type, payload: { pollId } };
        commit({ type: DownloadResultsMutation.PollingStatusStarted, payload });
    },
};

const getDownloadStatus = async (store: ActionContext<DownloadResultsState, RootState>, type: DownloadType): Promise<void> => {
    const { state, dispatch, rootState, commit } = store;
    const downloadId = state[type].downloadId;
    const response = await api(store)
        .withSuccess(DownloadResultsMutation.StatusUpdated, false, payloadHandler(type))
        .withError(DownloadResultsMutation.Error, false, payloadHandler(type))
        .get<ModelStatusResponse>(`download/status/${downloadId}`);
    if (response?.data?.done && type !== DownloadType.AGYW) {
        await getADRUploadMetadata(response, dispatch).then(() => {
            // commit is neccessary for dispatching action
            // to retrieve metadata for output
            const payload = { type, payload: rootState.metadata.adrUploadMetadataError };
            commit({ type: DownloadResultsMutation.MetadataError, payload });
        });
    }
};

const getADRUploadMetadata = async function (response: ResponseWithType<ModelStatusResponse>, dispatch: Dispatch) {
    await dispatch("metadata/getAdrUploadMetadata", response.data.id, { root: true });
}
