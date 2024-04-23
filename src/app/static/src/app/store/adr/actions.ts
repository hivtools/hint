import {ActionContext, ActionTree} from "vuex";
import {api} from "../../apiService";
import qs from "qs";
import {ADRState} from "./adr";
import {ADRMutation} from "./mutations";
import {datasetFromMetadata} from "../../utils";
import {ADRSchemas, Organization, Release} from "../../types";
import {BaselineMutation} from "../baseline/mutations";
import {RootState} from "../../root";

export interface ADRActions {
    fetchKey: (store: ActionContext<ADRState, RootState>) => void;
    saveKey: (store: ActionContext<ADRState, RootState>, key: string) => void;
    deleteKey: (store: ActionContext<ADRState, RootState>) => void;
    getDatasets: (store: ActionContext<ADRState, RootState>) => void;
    getDatasetsWithOutput: (store: ActionContext<ADRState, RootState>) => void;
    getReleases: (store: ActionContext<ADRState, RootState>, id: string) => void;
    getDataset: (store: ActionContext<ADRState, RootState>, payload: GetDatasetPayload) => void;
    getSchemas: (store: ActionContext<ADRState, RootState>) => void;
    getUserCanUpload: (store: ActionContext<ADRState, RootState>) => void;
    ssoLoginMethod: (store: ActionContext<ADRState, RootState>) => void;
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

    async ssoLoginMethod(context) {
        console.log("calling sso login method")
        await api<ADRMutation, ADRMutation>(context)
            .ignoreErrors()
            .withSuccess(ADRMutation.SetSSOLogin)
            .get("/sso")
            .then((response) => {
                if (response && response.data) {
                    context.dispatch("getDatasets")
                    context.dispatch("getDatasetsWithOutput")
                }
            })
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
        console.log("getting datasets")
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

    async getDatasetsWithOutput(context) {
        const {state, dispatch, commit} = context;
        console.log("getting datasets with output resource")
        commit({type: ADRMutation.SetFetchingDatasets, payload: true});
        commit({type: ADRMutation.SetADRError, payload: null});
        if (!state.schemas) {
            await dispatch("getSchemas");
        }

        if (state.schemas?.outputZip) {
            await api<ADRMutation, ADRMutation>(context)
                .withError(ADRMutation.SetADRError)
                .withSuccess(ADRMutation.SetDatasetsWithOutput)
                .get(`/adr/datasetsWithResource?resourceType=${state.schemas.outputZip}`)
                .then(() => {
                    commit({type: ADRMutation.SetFetchingDatasets, payload: false});
                });
        } else {
            commit({type: ADRMutation.SetFetchingDatasets, payload: false});
            commit({type: ADRMutation.SetADRError, payload: {
                error: "Failed to get output zip schema",
                detail: "No schema for output zip type returned. Something went badly wrong, please contact a system administrator"
            }})
        }
    },

    async getReleases(context, selectedDatasetId) {
        await api<ADRMutation, BaselineMutation>(context)
            .withError(BaselineMutation.BaselineError)
            .withSuccess(ADRMutation.SetReleases)
            .get(`/adr/datasets/${selectedDatasetId}/releases/`)
    },

    async getDataset(context, {id, release}) {
        const {state, commit} = context;
        let url = `/adr/datasets/${id}`
        if (release?.id) {
            url += '?' + new URLSearchParams({release: release.id});
        }
        await api<BaselineMutation, ADRMutation>(context)
            .withError(ADRMutation.SetADRError)
            .ignoreSuccess()
            .get(url)
            .then(response => {
                if (response) {
                    const releaseId = release?.id
                    const dataset = datasetFromMetadata(response.data, state.schemas!, releaseId);
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
