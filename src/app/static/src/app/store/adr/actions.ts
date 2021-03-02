import {ActionContext, ActionTree} from "vuex";
import {RootState} from "../../root";
import {api} from "../../apiService";
import qs from "qs";
import {ADRState} from "./adr";
import {ADRMutation} from "./mutations";
import {findResource} from "../../utils";
import {BaselineMutation} from "../baseline/mutations";
import {DatasetResourceSet} from "../../types";

export interface ADRActions {
    fetchKey: (store: ActionContext<ADRState, RootState>) => void;
    saveKey: (store: ActionContext<ADRState, RootState>, key: string) => void;
    deleteKey: (store: ActionContext<ADRState, RootState>) => void;
    getDatasets: (store: ActionContext<ADRState, RootState>) => void;
    getSchemas: (store: ActionContext<ADRState, RootState>) => void;
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

    async getUploadFiles(context) {
        const {state, rootState, commit} = context;
        const selectedDataset = rootState.baseline.selectedDataset;

        if (selectedDataset) {
            await api(context)
                .ignoreErrors()
                .ignoreSuccess()
                .get(`/adr/datasets/${selectedDataset.id}`)
                .then((response) => {
                    if (response) {
                        const metadata = response.data;
                        const schemas = rootState.adr.schemas!;

                        const project = rootState.projects.currentProject;
                        if (!project) {
                            throw "No current project";
                        }

                        const constructResource = (index: number, resourceType: string, resourceFilename: string, displayName: string) => {
                            const resource = findResource(metadata, resourceType);
                            const resourceId = resource ? resource.id : null;
                            const lastModified = resource ? ([resource.lastModified, resource.metadataModified].sort()[1]) : null;
                            const url = resource ? resource.url : null

                            return {
                                index,
                                displayName,
                                resourceType,
                                resourceFilename,
                                resourceId,
                                lastModified,
                                url
                            }
                        };


                    }

                });
        }
    }
};

