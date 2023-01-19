import {MutationTree} from "vuex";
import {DownloadIndicatorState} from "./downloadIndicator";

export enum DownloadIndicatorMutation {
    DownloadingIndicator = "DownloadingIndicator"
}

export const mutations: MutationTree<DownloadIndicatorState> = {
    [DownloadIndicatorMutation.DownloadingIndicator](state: DownloadIndicatorState, payload: boolean) {
        state.downloadingIndicator = payload
    }
}
