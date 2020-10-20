import Vue from "vue";
import { ActionContext, ActionTree } from "vuex";
import { api } from "../../apiService";
import { RootState } from "../../root";
import { HintrVersionState } from "./hintrVersion";
import { HintrVersionMutation } from "./mutations";

export type HintrVersionActionTypes = "HintrVersionFetched"

export interface HintrVersionActions {
    getHintrVersion: (store: ActionContext<HintrVersionState, RootState>) => void
}

export const actions: ActionTree<HintrVersionState, RootState> & HintrVersionActions = {

    async getHintrVersion(context) 
    {
        await api<HintrVersionMutation, HintrVersionMutation>(context)
            .withSuccess(HintrVersionMutation.HintrVersionFetched)
            .ignoreErrors()
            .get(`/meta/hintr/version`);
    }
}