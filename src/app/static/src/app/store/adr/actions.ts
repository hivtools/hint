import {ActionContext, ActionTree} from "vuex";
import {RootState} from "../../root";
import {api} from "../../apiService";
import qs from "qs";
import {ADRState} from "./adr";
import {ADRMutation} from "./mutations";
import {constructUploadFile, constructUploadFileWithResourceName, datasetFromMetadata} from "../../utils";
import {Organization, UploadFile, Dict} from "../../types";
import {BaselineMutation} from "../baseline/mutations";
import {switches} from "../../featureSwitches";
import {
    AncResponse,
    PjnzResponse,
    PopulationResponse,
    ProgrammeResponse,
    ShapeResponse,
    SurveyResponse, ValidateInputResponse
} from "../../generated";

export interface ADRActions {
    fetchKey: (store: ActionContext<ADRState, RootState>) => void;
    saveKey: (store: ActionContext<ADRState, RootState>, key: string) => void;
    deleteKey: (store: ActionContext<ADRState, RootState>) => void;
    getDatasets: (store: ActionContext<ADRState, RootState>) => void;
    getSchemas: (store: ActionContext<ADRState, RootState>) => void;
    getUserCanUpload: (store: ActionContext<ADRState, RootState>) => void;
    getUploadFiles: (store: ActionContext<ADRState, RootState>) => void;
    uploadFilesToADR: (store: ActionContext<ADRState, RootState>, uploadFilesPayload: UploadFile[]) => void;
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
            if (!selectedDataset.organization) {
                await getAndSetDatasets(context, selectedDataset.id)
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

    async getUploadFiles(context) {
        const {state, rootState, commit} = context;
        const selectedDataset = rootState.baseline.selectedDataset;
        const project = rootState.projects.currentProject;

        if (selectedDataset && project) {
            context.commit({type: ADRMutation.SetADRError, payload: null});
            await api(context)
                .withError(ADRMutation.SetADRError)
                .ignoreSuccess()
                .get(`/adr/datasets/${selectedDataset.id}`)
                .then((response) => {
                    if (response) {
                        const metadata = response.data;
                        const schemas = state.schemas!;

                        const uploadFiles: Dict<UploadFile> =  {
                            outputZip: constructUploadFileWithResourceName(
                                metadata,
                                0,
                                schemas.outputZip,
                                `${project.name}_naomi_outputs.zip`,
                                "uploadFileOutputZip",
                                `${project.name} Naomi Outputs`),
                            outputSummary: constructUploadFileWithResourceName(
                                metadata,
                                1,
                                schemas.outputSummary,
                                `${project.name}_naomi_summary.html`,
                                "uploadFileOutputSummary",
                                `${project.name} Naomi Summary`)
                        };

                        if (switches.adrPushInputs) {

                            const addLocalInputFileToUploads = (
                                key: string,
                                schema: string,
                                response: ValidateInputResponse,
                                displayName: string) => {
                                if (!response.fromADR) {
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
                        }

                        commit({type: ADRMutation.SetUploadFiles, payload: uploadFiles});
                    }
                });
        }
    },

    async uploadFilesToADR(context, uploadFilesPayload) {
        const {state, rootState, commit, dispatch} = context;
        const uploadMetadata = rootState.modelRun.result?.uploadMetadata
        const selectedDatasetId = rootState.baseline.selectedDataset!.id;
        const modelCalibrateId = rootState.modelCalibrate.calibrateId;

        commit({type: ADRMutation.ADRUploadStarted, payload: uploadFilesPayload.length});

        for (let i = 0; i < uploadFilesPayload.length; i++) {
            commit({type: ADRMutation.ADRUploadProgress, payload: i + 1});
            const { resourceType, resourceFilename, resourceName, resourceId } = uploadFilesPayload[i];

            const requestParams: Dict<string> = {resourceFileName: resourceFilename, resourceName}
            if (resourceId) {
                requestParams["resourceId"] = resourceId
            }
            if (resourceType === state.schemas?.outputSummary) {
                requestParams["description"] = uploadMetadata
                    ? uploadMetadata.outputSummary.description
                    : "Naomi summary report uploaded from Naomi web app"
            }
            if (resourceType === state.schemas?.outputZip) {
                requestParams["description"] = uploadMetadata
                    ? uploadMetadata.outputZip.description
                    : "Naomi output uploaded from Naomi web app"
            }

            if (resourceId) {
                requestParams["resourceId"] = resourceId
            }

            let apiRequest = api<ADRMutation, ADRMutation>(context)
                                        .withError(ADRMutation.SetADRUploadError);
            if  (i === uploadFilesPayload.length - 1) {
                apiRequest = apiRequest.withSuccess(ADRMutation.ADRUploadCompleted);
            } else {
                apiRequest = apiRequest.ignoreSuccess();
            }
            const response = await apiRequest.postAndReturn(`/adr/datasets/${selectedDatasetId}/resource/${resourceType}/${modelCalibrateId}`,
                qs.stringify(requestParams))
            if (!response) {
                break
            }
        }
        await getAndSetDatasets(context, selectedDatasetId)
        dispatch("getUploadFiles");
    }
};

async function getAndSetDatasets(context: ActionContext<ADRState, RootState>, selectedDatasetId: string){
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

