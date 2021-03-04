import {ActionContext, ActionTree} from "vuex";
import {RootState} from "../../root";
import {api} from "../../apiService";
import qs from "qs";
import {ADRState} from "./adr";
import {ADRMutation} from "./mutations";
import {constructUploadFile, datasetFromMetadata, findResource} from "../../utils";
import {Organization} from "../../types";

export interface ADRActions {
    fetchKey: (store: ActionContext<ADRState, RootState>) => void;
    saveKey: (store: ActionContext<ADRState, RootState>, key: string) => void;
    deleteKey: (store: ActionContext<ADRState, RootState>) => void;
    getDatasets: (store: ActionContext<ADRState, RootState>) => void;
    getSchemas: (store: ActionContext<ADRState, RootState>) => void;
    getUserCanUpload: (store: ActionContext<ADRState, RootState>) => void;
    getUploadFiles: (store: ActionContext<ADRState, RootState>) => void;
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
        await api<ADRMutation, ADRMutation>(context)
            .ignoreErrors()
            .withSuccess(ADRMutation.SetDatasets)
            .get("/adr/datasets/")
            .then(() => {
                context.commit({type: ADRMutation.SetFetchingDatasets, payload: false});
            });
    },

    async getSchemas(context) {
        await api<ADRMutation, ADRMutation>(context)
            .ignoreErrors()
            .withSuccess(ADRMutation.SetSchemas)
            .get("/adr/schemas/")
    },

    async getUserCanUpload(context) {
        const {state, rootState, commit} = context;
        const selectedDataset = rootState.baseline.selectedDataset;

        if (selectedDataset) {
            await api(context)
                .withError(ADRMutation.SetADRError)
                .ignoreSuccess()
                .get("/adr/orgs?permission=update_dataset")
                .then((response) => {
                    if (response) {
                        //For backward compatibility, we may have to regenerate the dataset metadata to provide the
                        //organisation id
                        if (!selectedDataset.organization) {
                            const regenDataset = datasetFromMetadata(selectedDataset.id, state.datasets, state.schemas!);
                            //TODO: set in the state
                        }

                        //NB if this project was created before this feature was added, the selected dataset
                        //will not have organisation recorded  - need to re-fetch. (HOW?)
                        //NB The same things goes for 'id' on the dataset introduced for construct upload files - but
                        //this action comes first...

                        const updateableOrgs = response.data as Organization[];
                        const selectedDatasetOrgId = selectedDataset.organization.id;
;                       const canUpload = updateableOrgs.some(org => org.id === selectedDatasetOrgId);
                        commit({type: ADRMutation.SetUserCanUpload, payload: canUpload});
                    }
                })
        }

    },

    async getUploadFiles(context) {
        const {state, rootState, commit} = context;
        const selectedDataset = rootState.baseline.selectedDataset;
        const project = rootState.projects.currentProject;

        if (selectedDataset && project) {
            await api(context)
                .withError(ADRMutation.SetADRError)
                .ignoreSuccess()
                .get(`/adr/datasets/${selectedDataset.id}`)
                .then((response) => {
                    if (response) {
                        const metadata = response.data;
                        const schemas = state.schemas!;

                        const uploadFiles = {
                            outputZip: constructUploadFile(
                                metadata,
                                0,
                                schemas.outputZip,
                                `${project.name}_naomi_outputs.zip`,
                                "uploadFileOutputZip"),
                            outputSummary: constructUploadFile(
                                metadata,
                                1,
                                schemas.outputSummary,
                                `${project.name}_naomi_summary.html`,
                                "uploadFileOutputSummary")
                        };

                        commit({type: ADRMutation.SetUploadFiles, payload: uploadFiles});
                    }
                });
        }
    }
};

