import {ActionContext, ActionTree, Dispatch} from "vuex";
import {RootState} from "../../root";
import {DownloadResultsState} from "./downloadResults";
import {api, ResponseWithType} from "../../apiService";
import {DownloadResultsMutation} from "./mutations";
import {ModelStatusResponse} from "../../generated";
import { DownloadType, downloadPostConfig } from "./downloadConfig";

export interface DownloadResultsActions {
    prepareAllOutputs: (store: ActionContext<DownloadResultsState, RootState>) => Promise<void>
    prepareOutput: (store: ActionContext<DownloadResultsState, RootState>, type: DownloadType) => Promise<void>
    poll: (store: ActionContext<DownloadResultsState, RootState>, type: DownloadType, interval?: number | null) => Promise<void>
}

const payloadHandler = (type: DownloadType) => {
    return (payload: any) => ({ type, payload });
};

export const actions: ActionTree<DownloadResultsState, RootState> & DownloadResultsActions = {
    async prepareAllOutputs({ dispatch }) {
        Object.values(DownloadType).forEach(type => {
            dispatch("prepareOutput", type);
        });
    },

    async prepareOutput(store, type) {
        const { state, dispatch, commit } = store;
        if (state[type].downloadId || state[type].fetchingDownloadId) return;
        commit({ type: DownloadResultsMutation.SetFetchingDownloadId, payload: type });
        const postConfig = downloadPostConfig[type];
        const response = await api(store)
            .withSuccess(DownloadResultsMutation.Preparing, false, payloadHandler(type))
            .withError(DownloadResultsMutation.Error, false, payloadHandler(type))
            .postAndReturn(postConfig.url(store), postConfig.body(store));
        if (response) {
            await dispatch("poll", type);
        }
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
    if (response?.data?.done) {
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
