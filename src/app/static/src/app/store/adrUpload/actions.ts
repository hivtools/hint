import {ActionContext, ActionTree} from "vuex";
import {RootState} from "../../root";
import {api} from "../../apiService";
import qs from "qs";
import {ADRUploadState} from "./adrUpload";
import {ADRUploadMutation} from "./mutations";
import {constructUploadFile} from "../../utils";
import {Dict, UploadFile} from "../../types";

export interface ADRUploadActions {
    getUploadFiles: (store: ActionContext<ADRUploadState, RootState>) => void;
    uploadFilesToADR: (store: ActionContext<ADRUploadState, RootState>, uploadFilesPayload: UploadFile[]) => void;
}

export const actions: ActionTree<ADRUploadState, RootState> & ADRUploadActions = {
    async getUploadFiles(context) {
        const {rootState, commit} = context;
        const selectedDataset = rootState.baseline.selectedDataset;
        const project = rootState.projects.currentProject;

        if (selectedDataset && project) {
            commit({type: ADRUploadMutation.SetADRUploadError, payload: null});
            await api(context)
                .withError(ADRUploadMutation.SetADRUploadError)
                .ignoreSuccess()
                .get(`/adr/datasets/${selectedDataset.id}`)
                .then((response) => {
                    if (response) {
                        const metadata = response.data;
                        const schemas = rootState.adr.schemas!;

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

                        commit({type: ADRUploadMutation.SetUploadFiles, payload: uploadFiles});
                    }
                });
        }
    },

    async uploadFilesToADR(context, uploadFilesPayload) {
        const {rootState, commit, dispatch} = context;
        const uploadMetadata = rootState.modelRun.result?.uploadMetadata
        const selectedDatasetId = rootState.baseline.selectedDataset!.id;
        const modelCalibrateId = rootState.modelCalibrate.calibrateId;

        commit({type: ADRUploadMutation.ADRUploadStarted, payload: uploadFilesPayload.length});

        for (let i = 0; i < uploadFilesPayload.length; i++) {
            commit({type: ADRUploadMutation.ADRUploadProgress, payload: i + 1});
            const {resourceType, resourceFilename, resourceId} = uploadFilesPayload[i]

            const requestParams: Dict<string> = {resourceFileName: resourceFilename}
            if (resourceId) {
                requestParams["resourceId"] = resourceId
            }
            if (resourceType === rootState.adr.schemas?.outputSummary) {
                requestParams["description"] = uploadMetadata
                    ? uploadMetadata.outputSummary.description
                    : "Naomi summary report uploaded from Naomi web app"
            }
            if (resourceType === rootState.adr.schemas?.outputZip) {
                requestParams["description"] = uploadMetadata
                    ? uploadMetadata.outputZip.description
                    : "Naomi output uploaded from Naomi web app"
            }

            let apiRequest = api<ADRUploadMutation, ADRUploadMutation>(context)
                .withError(ADRUploadMutation.SetADRUploadError);
            if (i === uploadFilesPayload.length - 1) {
                apiRequest = apiRequest.withSuccess(ADRUploadMutation.ADRUploadCompleted);
            } else {
                apiRequest = apiRequest.ignoreSuccess();
            }
            const response = await apiRequest.postAndReturn(`/adr/datasets/${selectedDatasetId}/resource/${resourceType}/${modelCalibrateId}`,
                qs.stringify(requestParams))
            if (!response) {
                break
            }
        }
        await dispatch("adr/getAndSetDatasets", selectedDatasetId, {root: true});
        await dispatch("getUploadFiles");
    }
};
