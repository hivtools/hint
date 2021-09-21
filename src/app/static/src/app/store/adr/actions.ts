import {ActionContext, ActionTree} from "vuex";
import {RootState} from "../../root";
import {api} from "../../apiService";
import qs from "qs";
import {ADRState} from "./adr";
import {ADRMutation} from "./mutations";
import {datasetFromMetadata} from "../../utils";
import {Organization, Release} from "../../types";
import {BaselineMutation} from "../baseline/mutations";

export interface ADRActions {
    fetchKey: (store: ActionContext<ADRState, RootState>) => void;
    saveKey: (store: ActionContext<ADRState, RootState>, key: string) => void;
    deleteKey: (store: ActionContext<ADRState, RootState>) => void;
    getDatasets: (store: ActionContext<ADRState, RootState>) => void;
    getReleases: (store: ActionContext<ADRState, RootState>, id: string) => void;
    getDataset: (store: ActionContext<ADRState, RootState>, payload: GetDatasetPayload) => void;
    getSchemas: (store: ActionContext<ADRState, RootState>) => void;
    getUserCanUpload: (store: ActionContext<ADRState, RootState>) => void;
}

export interface GetDatasetPayload {
    id: string
    release?: Release
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
        await api<ADRMutation, BaselineMutation>(context)
            .withError(BaselineMutation.BaselineError)
            .withSuccess(ADRMutation.SetReleases)
            .get(`/adr/datasets/${selectedDatasetId}/releases/`)
    },

    async getDataset(context, {id, release}) {
        console.log("release in getDataset action", release)
        const {state, commit} = context;
        let url = `/adr/datasets/${id}`
        if (release?.id) {
            url += '?' + new URLSearchParams({release: release.id});
        }
        console.log("url in getDataset action", url)
        await api<BaselineMutation, ADRMutation>(context)
            .withError(ADRMutation.SetADRError)
            .ignoreSuccess()
            .get(url)
            .then(response => {
                if (response) {
                    console.log("response in getDataset action", response)
                    const releaseId = release?.id
                    const dataset = datasetFromMetadata(response.data, state.schemas!, releaseId);
                    console.log("datset in getDataset action", dataset)
                    commit(`baseline/${BaselineMutation.SetDataset}`, dataset, {root: true});
                    commit(`baseline/${BaselineMutation.SetRelease}`, release || null, {root: true});
                }
            });
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
                await dispatch("getDataset", {id: selectedDataset.id, release: selectedDataset.release});
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
    }
};
