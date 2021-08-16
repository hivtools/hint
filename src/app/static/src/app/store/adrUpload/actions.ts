import {ActionContext, ActionTree} from "vuex";
import {RootState} from "../../root";
import {api} from "../../apiService";
import qs from "qs";
import {ADRUploadState} from "./adrUpload";
import {ADRUploadMutation} from "./mutations";
import {constructUploadFile, constructUploadFileWithResourceName, findResource} from "../../utils";
import {Dict, UploadFile} from "../../types";
import {switches} from "../../featureSwitches";
import {ValidateInputResponse} from "../../generated";

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
            let url = `/adr/datasets/${selectedDataset.id}`;
            if (selectedDataset.release) {
                url += '?' + new URLSearchParams({release: selectedDataset.release});
            }
            commit({type: ADRUploadMutation.SetADRUploadError, payload: null});
            await api(context)
                .withError(ADRUploadMutation.SetADRUploadError)
                .ignoreSuccess()
                .get(url)
                .then((response) => {
                    if (response) {
                        const metadata = response.data;
                        const schemas = rootState.adr.schemas!;
                        console.log("metadata", metadata)
                        console.log("schemas", schemas)

                        const outputZip = findResource(metadata, schemas.outputZip);
                        const outputSummary = findResource(metadata, schemas.outputSummary);
                        console.log("outputZip", outputZip)

                        if (switches.adrPushInputs) {
                            const pjnz = findResource(metadata, schemas.pjnz);
                            const pop = findResource(metadata, schemas.population);
                            const shape = findResource(metadata, schemas.shape);
                            const survey = findResource(metadata, schemas.survey);
                            const program = findResource(metadata, schemas.programme);
                            const anc = findResource(metadata, schemas.anc);
                            commit({type: ADRUploadMutation.SetUploadFiles, payload: {pjnz, pop, shape, survey, program, anc, outputZip, outputSummary}});
                        } else {
                            commit({type: ADRUploadMutation.SetUploadFiles, payload: {outputZip, outputSummary}});
                        }
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
            const { resourceType, resourceFilename, resourceName, resourceId } = uploadFilesPayload[i];

            const requestParams: Dict<string> = {resourceFileName: resourceFilename, resourceName};
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
        await dispatch("getUploadFiles");
    }
};
