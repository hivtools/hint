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

    async getHintrVersion(context) {
        const { commit } = context;
        const response = await api<HintrVersionMutation, HintrVersionMutation>(context)
            .ignoreSuccess()
            .ignoreErrors()
            .get(`/meta/hintr/version`);

        if (response) {
            commit({ type: HintrVersionMutation.HintrVersionFetched, payload: response.data })
        }
    }

}
