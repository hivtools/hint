import {ActionContext, ActionTree} from "vuex";
import {api, APIService} from "../../apiService";
import qs from "qs";
import {AdrDatasetType, ADRState, getAdrDatasetUrl, getAdrReleaseUrl} from "./adr";
import {ADRMutation, DatasetTypePayload} from "./mutations";
import {datasetFromMetadata, findResource, resourceTypes} from "../../utils";
import {Organization, Release} from "../../types";
import {BaselineMutation} from "../baseline/mutations";
import {RootState} from "../../root";
import {Error, Response} from "../../generated";

export interface ADRActions {
    fetchKey: (store: ActionContext<ADRState, RootState>) => void;
    saveKey: (store: ActionContext<ADRState, RootState>, key: string) => void;
    deleteKey: (store: ActionContext<ADRState, RootState>) => void;
    getDatasets: (store: ActionContext<ADRState, RootState>, type: AdrDatasetType) => void;
    getReleases: (store: ActionContext<ADRState, RootState>, payload: GetReleasesPayload) => void;
    getDataset: (store: ActionContext<ADRState, RootState>, payload: GetDatasetPayload) => void;
    getSchemas: (store: ActionContext<ADRState, RootState>) => void;
    getUserCanUpload: (store: ActionContext<ADRState, RootState>) => void;
    ssoLoginMethod: (store: ActionContext<ADRState, RootState>) => void;
}

export interface GetDatasetPayload {
    id: string
    releaseId?: string
    datasetType: AdrDatasetType
}

export interface GetReleasesPayload {
    id: string,
    datasetType: AdrDatasetType
}

const payloadHandler = (datasetType: AdrDatasetType) => {
    return (data: any) => ({ datasetType, data });
};

export const actions: ActionTree<ADRState, RootState> & ADRActions = {
    async fetchKey(context) {
        await api<ADRMutation, ADRMutation>(context)
            .ignoreErrors()
            .withSuccess(ADRMutation.UpdateKey)
            .get("/adr/key/");
    },

    async ssoLoginMethod(context) {
        await api<ADRMutation, ADRMutation>(context)
            .ignoreErrors()
            .withSuccess(ADRMutation.SetSSOLogin)
            .get("/sso")
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

    async getDatasets(context, datasetType: AdrDatasetType) {
        const { commit } = context;
        commit({type: ADRMutation.SetFetchingDatasets, payload: {datasetType, data: true}});
        commit({type: ADRMutation.SetADRError, payload: {datasetType, data: null}});
        const url = getAdrDatasetUrl(datasetType);
        await api<ADRMutation, ADRMutation>(context)
            .withError(ADRMutation.SetADRError, false, payloadHandler(datasetType))
            .withSuccess(ADRMutation.SetDatasets, false, payloadHandler(datasetType))
            .get(url)
        commit({type: ADRMutation.SetFetchingDatasets, payload: {datasetType, data: false}});
    },

    async getReleases(context, payload: GetReleasesPayload) {
        const url = getAdrReleaseUrl(payload.datasetType, payload.id);
        await api<ADRMutation, string>(context)
            .withError(`baseline/${BaselineMutation.BaselineError}`, true)
            .withSuccess(ADRMutation.SetReleases, false, payloadHandler(payload.datasetType))
            .get(url)
    },

    async getDataset(context, {id, releaseId, datasetType}) {
        const {state, commit} = context;
        let url = `/adr/datasets/${id}`
        let release: Release | null = null
        if (releaseId) {
            url += '?' + new URLSearchParams({release: releaseId});
            release = state.adrData[datasetType].releases.find((rel: Release) => rel.id === releaseId);
        }
        await api<BaselineMutation, ADRMutation>(context)
            .withError(ADRMutation.SetADRError, false, payloadHandler(datasetType))
            .ignoreSuccess()
            .get(url)
            .then(response => {
                if (response) {
                    if (datasetType === AdrDatasetType.Input) {
                        const dataset = datasetFromMetadata(response.data, state.schemas!, releaseId);
                        commit(`baseline/${BaselineMutation.SetDataset}`, dataset, {root: true});
                        commit(`baseline/${BaselineMutation.SetRelease}`, release, {root: true});
                    } else if (datasetType === AdrDatasetType.Output) {
                        const outputZipResource = findResource(response.data, resourceTypes.outputZip);
                        commit(`projects/SetAdrRehydrateOutputZip`,
                            {payload: outputZipResource},
                            {root: true})
                    }
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
                await dispatch("getDataset", {
                    id: selectedDataset.id,
                    release: selectedDataset.release,
                    datasetType: AdrDatasetType.Input
                });
            }
            const selectedDatasetOrgId = rootState.baseline.selectedDataset!.organization.id

            const errorCallback = (e: Error): DatasetTypePayload<Error | null>["payload"] => ({
                datasetType: AdrDatasetType.Input, data: e
            });
            const successCallback = (data: Organization[]) => data.some(org => org.id === selectedDatasetOrgId);

            await api(context)
                .withError(ADRMutation.SetADRError, false, errorCallback)
                .withSuccess(ADRMutation.SetUserCanUpload, false, successCallback)
                .get("/adr/orgs?permission=update_dataset")
        }
    }
};
