import {exportService} from "../../dataExportService";
import {ActionContext, ActionTree} from "vuex";
import {DownloadIndicatorPayload} from "../../types";
import {DownloadIndicatorState} from "./downloadIndicator";
import {DataExplorationState} from "../dataExploration/dataExploration";
import {DownloadIndicatorMutation} from "./mutations";

export interface DownloadIndicatorActions {
    downloadFile: (store: ActionContext<DownloadIndicatorState, DataExplorationState>, payload: DownloadIndicatorPayload) => void
}

export const actions: ActionTree<DownloadIndicatorState, DataExplorationState> & DownloadIndicatorActions = {
    downloadFile(context, payload) {
        const {commit} = context
        commit({type: DownloadIndicatorMutation.DownloadingIndicator, payload: true})
        exportService(payload)
            .addUnfilteredData()
            .addFilteredData()
            .download()
        commit({type: DownloadIndicatorMutation.DownloadingIndicator, payload: false})
    }
}
