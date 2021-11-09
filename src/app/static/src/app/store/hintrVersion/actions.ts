import { ActionContext, ActionTree } from "vuex";
import { api } from "../../apiService";
import { HintrVersionState } from "./hintrVersion";
import { HintrVersionMutation } from "./mutations";
import {DataExplorationState} from "../dataExploration/dataExploration";

export type HintrVersionActionTypes = "HintrVersionFetched"

export interface HintrVersionActions {
    getHintrVersion: (store: ActionContext<HintrVersionState, DataExplorationState>) => void
}

export const actions: ActionTree<HintrVersionState, DataExplorationState> & HintrVersionActions = {

    async getHintrVersion(context) 
    {
        await api<HintrVersionMutation, HintrVersionMutation>(context)
            .withSuccess(HintrVersionMutation.HintrVersionFetched)
            .ignoreErrors()
            .get(`/meta/hintr/version`);
    }
}