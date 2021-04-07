import {ActionContext, ActionTree} from "vuex";
import {RootState} from "../../root";
import {api} from "../../apiService";
import qs from "qs";
import {ADRState} from "./adr";
import {ADRMutation} from "./mutations";
import {constructUploadFile, datasetFromMetadata} from "../../utils";
import {Organization, UploadFile, Dict} from "../../types";
import {BaselineMutation} from "../baseline/mutations";
import {switches} from "../../featureSwitches";
import {
    AncResponse,
    PjnzResponse,
    PopulationResponse,
    ProgrammeResponse,
    ShapeResponse,
    SurveyResponse
} from "../../generated";

export interface ADRActions {
    fetchKey: (store: ActionContext<ADRState, RootState>) => void;
    saveKey: (store: ActionContext<ADRState, RootState>, key: string) => void;
    deleteKey: (store: ActionContext<ADRState, RootState>) => void;
    getDatasets: (store: ActionContext<ADRState, RootState>) => void;
    getSchemas: (store: ActionContext<ADRState, RootState>) => void;
    getUserCanUpload: (store: ActionContext<ADRState, RootState>) => void;
    getUploadFiles: (store: ActionContext<ADRState, RootState>) => void;
    uploadFilestoADR: (store: ActionContext<ADRState, RootState>, uploadFilesPayload: UploadFile[]) => void;
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
            //For backward compatibility, we may have to regenerate the dataset metadata to provide the
            //organisation id for projects which are reloaded
            let selectedDatasetOrgId: string;
            if (!selectedDataset.organization) {
                //We may also have to fetch the selected dataset metadata too, if not loaded during this session
                let datasets = state.datasets;
                if (!datasets.length) {
                    await api(context)
                        .ignoreErrors()
                        .ignoreSuccess()
                        .get(`/adr/datasets/${selectedDataset.id}`)
                        .then((response) => {
                            if (response) {
                                datasets = [response.data];
                            }
                        });
                }

                const regenDataset = datasetFromMetadata(selectedDataset.id, datasets, state.schemas!);
                commit(`baseline/${BaselineMutation.SetDataset}`, regenDataset, {root: true});
                selectedDatasetOrgId = regenDataset.organization.id;
            } else {
                selectedDatasetOrgId = selectedDataset.organization.id;
            }

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

                        const uploadFiles =  {
                            outputZip: constructUploadFile(
                                metadata,
                                0,
                                schemas.outputZip,
                                `${project.name}_naomi_outputs.zip`,
                                `${project.name} Naomi Outputs`,
                                "uploadFileOutputZip"),
                            outputSummary: constructUploadFile(
                                metadata,
                                1,
                                schemas.outputSummary,
                                `${project.name}_naomi_summary.html`,
                                `${project.name} Naomi Summary`,
                                "uploadFileOutputSummary")
                        } as Dict<UploadFile>;

                        if (switches.adrPushInputs) {

                            const addLocalInputFileToUploads = (
                                schema: string,
                                response: PjnzResponse | ShapeResponse | PopulationResponse | SurveyResponse
                                            | ProgrammeResponse | AncResponse,
                                displayName: string) => {
                               if (!response.fromADR) {
                                   const uploadFile = constructUploadFile(
                                       metadata,
                                       Object.keys(uploadFiles).length,
                                       schema,
                                       response.filename,
                                       null,
                                       displayName
                                   );
                                   if (uploadFile) {
                                       uploadFiles[schema] = uploadFile;
                                   }
                               }
                            };

                            const baseline = rootState.baseline;
                            addLocalInputFileToUploads(schemas.pjnz, baseline.pjnz!, "PJNZ");
                            addLocalInputFileToUploads(schemas.shape, baseline.shape!, "shape");
                            addLocalInputFileToUploads(schemas.population, baseline.population!, "population");

                            const sap = rootState.surveyAndProgram;
                            addLocalInputFileToUploads(schemas.survey, sap.survey!, "survey");
                            addLocalInputFileToUploads(schemas.programme, sap.program!, "ART");
                            addLocalInputFileToUploads(schemas.anc, sap.anc!, "ANC");
                        }

                        commit({type: ADRMutation.SetUploadFiles, payload: uploadFiles});
                    }
                });
        }
    },

    async uploadFilestoADR(context, uploadFilesPayload) {
        const {state, rootState, commit} = context;
        const selectedDatasetId = rootState.baseline.selectedDataset?.id;
        const modelCalibrateId = rootState.modelCalibrate.calibrateId;
        commit({type: ADRMutation.ADRUploadStarted});

        for (let i = 0; i < uploadFilesPayload.length; i++) {
            const { resourceType, resourceFilename, resourceName, resourceId } = uploadFilesPayload[i]

            const requestParams: Dict<string> = {resourceFileName: resourceFilename, resourceName}
            if (resourceId){
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
    }
};

