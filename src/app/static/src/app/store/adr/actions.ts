import {ActionContext, ActionTree} from "vuex";
import {RootState} from "../../root";
import {api} from "../../apiService";
import qs from "qs";
import {ADRState} from "./adr";
import {ADRMutation} from "./mutations";
import {datasetFromMetadata} from "../../utils";
import {Organization} from "../../types";
import {BaselineMutation} from "../baseline/mutations";

export interface ADRActions {
    fetchKey: (store: ActionContext<ADRState, RootState>) => void;
    saveKey: (store: ActionContext<ADRState, RootState>, key: string) => void;
    deleteKey: (store: ActionContext<ADRState, RootState>) => void;
    getDatasets: (store: ActionContext<ADRState, RootState>) => void;
    getSchemas: (store: ActionContext<ADRState, RootState>) => void;
    getUserCanUpload: (store: ActionContext<ADRState, RootState>) => void;
    getAndSetDatasets: (store: ActionContext<ADRState, RootState>, selectedDatasetId: string) => void;
}

export const actions: ActionTree<ADRState, RootState> & ADRActions = {
    async fetchKey(context) {
        await api<ADRMutation, ADRMutation>(context)
            .ignoreErrors()
            .withSuccess(ADRMutation.UpdateKey)
            .get("/adr/key/");
    },

    async saveKey(context, key) {
        context.commit({type: ADRMutation.SetKeyError, payload: null});
        await api<ADRMutation, ADRMutation>(context)
            .withError(ADRMutation.SetKeyError)
            .withSuccess(ADRMutation.UpdateKey)
            .postAndReturn("/adr/key/", qs.stringify({key}));
    },

    async deleteKey(context) {
        context.commit({type: ADRMutation.SetKeyError, payload: null});
        await api<ADRMutation, ADRMutation>(context)
            .withError(ADRMutation.SetKeyError)
            .withSuccess(ADRMutation.UpdateKey)
            .delete("/adr/key/")
    },

    async getDatasets(context) {
        context.commit({type: ADRMutation.SetFetchingDatasets, payload: true});
        context.commit({type: ADRMutation.SetADRError, payload: null});
        await api<ADRMutation, ADRMutation>(context)
            .withError(ADRMutation.SetADRError)
            .withSuccess(ADRMutation.SetDatasets)
            .get("/adr/datasets/")
            .then(() => {
                context.commit({type: ADRMutation.SetFetchingDatasets, payload: false});
            });
    },

    async getReleases(context, selectedDatasetId) {
        await api<ADRMutation, ADRMutation>(context)
            .withError(ADRMutation.SetADRError)
            .withSuccess(ADRMutation.SetReleases)
            .get(`/adr/datasets/${selectedDatasetId}/releases/`)
    },

    async getSchemas(context) {
        await api<ADRMutation, ADRMutation>(context)
            .ignoreErrors()
            .withSuccess(ADRMutation.SetSchemas)
            .get("/adr/schemas/")
    },

    async getUserCanUpload(context) {
        const {rootState, dispatch, commit} = context;
        const selectedDataset = rootState.baseline.selectedDataset;

        if (selectedDataset) {
            if (!selectedDataset.organization) {
                await dispatch("getAndSetDatasets", selectedDataset.id);
            }
            const selectedDatasetOrgId = rootState.baseline.selectedDataset!.organization.id

            await api(context)
                .withError(ADRMutation.SetADRError)
                .ignoreSuccess()
                .get("/adr/orgs?permission=update_dataset")
                .then(async (response) => {
                    if (response) {
                        const updateableOrgs = response.data as Organization[];
                        const canUpload = updateableOrgs.some(org => org.id === selectedDatasetOrgId);
                        commit({type: ADRMutation.SetUserCanUpload, payload: canUpload});
                    }
                })
        }
    },

    async getAndSetDatasets(context, selectedDatasetId) {
        const {state, commit} = context;
        let datasets = state.datasets;
        if (!datasets.length) {
            await api(context)
                .ignoreErrors()
                .ignoreSuccess()
                .get(`/adr/datasets/${selectedDatasetId}`)
                .then((response) => {
                    if (response) {
                        datasets = [response.data];
                    }
                });
        }
        const regenDataset = datasetFromMetadata(selectedDatasetId, datasets, state.schemas!);
        commit(`baseline/${BaselineMutation.SetDataset}`, regenDataset, {root: true});
    }
};
