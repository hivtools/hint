import {MutationTree} from "vuex";
import {DownloadIndicatorState} from "./downloadIndicator";
import {PayloadWithType} from "../../types";

export enum DownloadIndicatorMutation {
    DownloadingIndicator = "DownloadingIndicator"
}

export const mutations: MutationTree<DownloadIndicatorState> = {
    [DownloadIndicatorMutation.DownloadingIndicator](state: DownloadIndicatorState, action: PayloadWithType<boolean>) {
        state.downloadingIndicator = action.payload
    }
}
