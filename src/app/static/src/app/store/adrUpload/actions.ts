import {ActionContext, ActionTree} from "vuex";
import {RootState} from "../../root";
import {api} from "../../apiService";
import qs from "qs";
import {ADRUploadState} from "./adrUpload";
import {ADRUploadMutation} from "./mutations";
import {constructUploadFile, constructUploadFileWithResourceName} from "../../utils";
import {Dict, UploadFile} from "../../types";
import {switches} from "../../featureSwitches";
import {ValidateInputResponse} from "../../generated";

export interface ADRUploadActions {
    getUploadFiles: (store: ActionContext<ADRUploadState, RootState>) => void;
    uploadFilesToADR: (store: ActionContext<ADRUploadState, RootState>, uploadFilesPayload: {uploadFiles: UploadFile[], createRelease: boolean}) => void;
    createRelease: (store: ActionContext<ADRUploadState, RootState>) => void;
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

                        const uploadFiles: Dict<UploadFile> =  {
                            outputZip: constructUploadFileWithResourceName(
                                metadata,
                                0,
                                schemas.outputZip,
                                "naomi_outputs.zip",
                                "uploadFileOutputZip",
                                "Naomi Output ZIP"),
                            outputSummary: constructUploadFileWithResourceName(
                                metadata,
                                1,
                                schemas.outputSummary,
                                "naomi_summary.html",
                                "uploadFileOutputSummary",
                                "Naomi Results and Summary Report")
                        };

                        const addLocalInputFileToUploads = (
                            key: string,
                            schema: string,
                            response: ValidateInputResponse,
                            displayName: string) => {
                            const uploadFile = constructUploadFile(
                                metadata,
                                Object.keys(uploadFiles).length,
                                schema,
                                response.filename,
                                displayName
                            );
                            if (uploadFile) {
                                uploadFiles[key] = uploadFile;
                            }
                        };

                        const baseline = rootState.baseline;
                        addLocalInputFileToUploads("pjnz", schemas.pjnz, baseline.pjnz!, "PJNZ");
                        addLocalInputFileToUploads("shape", schemas.shape, baseline.shape!, "shape");
                        addLocalInputFileToUploads("population",  schemas.population, baseline.population!, "population");

                        const sap = rootState.surveyAndProgram;
                        addLocalInputFileToUploads("survey", schemas.survey, sap.survey!, "survey");
                        addLocalInputFileToUploads("programme", schemas.programme, sap.program!, "ART");
                        addLocalInputFileToUploads("anc", schemas.anc, sap.anc!, "ANC");
                        
                        commit({type: ADRUploadMutation.SetUploadFiles, payload: uploadFiles});
                    }
                });
        }
    },

    async uploadFilesToADR(context, uploadFilesPayload) {
        const {rootState, commit, dispatch} = context;
        const selectedDatasetId = rootState.baseline.selectedDataset!.id;
        const modelCalibrateId = rootState.modelCalibrate.calibrateId;
        const {uploadFiles, createRelease} = uploadFilesPayload
        let downloadId;

        const uploadMetadata = rootState.metadata.adrUploadMetadata

        commit({type: ADRUploadMutation.ADRUploadStarted, payload: uploadFiles.length});

        for (let i = 0; i < uploadFiles.length; i++) {
            commit({type: ADRUploadMutation.ADRUploadProgress, payload: i + 1});
            const { resourceType, resourceFilename, resourceName, resourceId } = uploadFiles[i];

            const requestParams: Dict<string> = {resourceFileName: resourceFilename, resourceName};
            if (resourceId) {
                requestParams["resourceId"] = resourceId
            }
            if (resourceType === rootState.adr.schemas?.outputSummary) {
                downloadId = rootState.downloadResults.summary.downloadId

                requestParams["description"] =
                    uploadMetadata?.find(meta => meta.type === "summary")?.description
                    || "Naomi summary report uploaded from Naomi web app"
            }

            if (resourceType === rootState.adr.schemas?.outputZip) {
                downloadId = rootState.downloadResults.spectrum.downloadId

                requestParams["description"] =
                    uploadMetadata?.find(meta => meta.type === "spectrum")?.description
                    || "Naomi output uploaded from Naomi web app"
            }

            let apiRequest = api<ADRUploadMutation, ADRUploadMutation>(context)
                .withError(ADRUploadMutation.SetADRUploadError);
            if (i === uploadFiles.length - 1) {
                apiRequest = apiRequest.withSuccess(ADRUploadMutation.ADRUploadCompleted);
            } else {
                apiRequest = apiRequest.ignoreSuccess();
            }
            const response = await apiRequest.postAndReturn(`/adr/datasets/${selectedDatasetId}/resource/${resourceType}/${downloadId}`,
                qs.stringify(requestParams))
            if (!response) {
                break
            }
        }
        await dispatch("getUploadFiles");

        const uploadComplete = rootState.adrUpload.uploadComplete;
        if (createRelease && uploadComplete){
            dispatch("createRelease");
        }
    },

    async createRelease(context) {
        const {rootState} = context;
        const selectedDatasetId = rootState.baseline.selectedDataset!.id;
        const project = rootState.projects.currentProject?.name;
        const version = rootState.projects.currentVersion?.versionNumber;
        const name = {name: `Naomi: ${project} v${version}`}

        await api(context)
                .withError(ADRUploadMutation.ReleaseFailed)
                .withSuccess(ADRUploadMutation.ReleaseCreated)
                .postAndReturn(`/adr/datasets/${selectedDatasetId}/releases`, qs.stringify(name));
    }
};
