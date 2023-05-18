import {ActionContext, ActionTree} from "vuex";
import {LoadingState, LoadState} from "./state";
import {emptyState, RootState} from "../../root";
import {api} from "../../apiService";
import {
    constructRehydrateProjectState,
    flatMapControlSections,
    verifyCheckSum
} from "../../utils";
import {Dict, LocalSessionFile, VersionDetails} from "../../types";
import {localStorageManager} from "../../localStorageManager";
import {router} from "../../router";
import {currentHintVersion} from "../../hintVersion";
import {initialStepperState} from "../stepper/stepper";
import {ModelStatusResponse, ProjectRehydrateResultResponse} from "../../generated";
import {DynamicFormData} from "@reside-ic/vue-dynamic-form";
import {ModelCalibrateState} from "../modelCalibrate/modelCalibrate";

export type LoadActionTypes = "SettingFiles" | "UpdatingState" | "LoadSucceeded" | "ClearLoadError" | "PreparingRehydrate" | "SaveProjectName" | "RehydrateStatusUpdated" | "RehydratePollingStarted" | "RehydrateResult" | "SetProjectName" | "RehydrateCancel"
export type LoadErrorActionTypes = "LoadFailed" | "RehydrateResultError"

export interface LoadActions {
    load: (store: ActionContext<LoadState, RootState>, file: File) => void
    preparingRehydrate: (store: ActionContext<LoadState, RootState>, file: FormData) => void
    setFiles: (store: ActionContext<LoadState, RootState>, payload: setFilesPayload) => void
    loadFromVersion: (store: ActionContext<LoadState, RootState>, versionDetails: VersionDetails) => void
    updateStoreState: (store: ActionContext<LoadState, RootState>, savedState: Partial<RootState>) => void
    clearLoadState: (store: ActionContext<LoadState, RootState>) => void
    pollRehydrate: (store: ActionContext<LoadState, RootState>) => void
}

export interface setFilesPayload {
    savedFileContents: string
}

export const actions: ActionTree<LoadState, RootState> & LoadActions = {

    async load(context, file) {
        const {dispatch} = context

        const reader = new FileReader();
        reader.addEventListener('loadend', function () {
            dispatch("setFiles", {savedFileContents: reader.result as string});
        });
        reader.readAsText(file);
    },

    async setFiles(context, payload) {
        const {savedFileContents} = payload;
        const {commit, rootState, rootGetters, dispatch, state} = context;
        commit({type: "SettingFiles", payload: null});

        const objectContents = verifyCheckSum(savedFileContents as string);

        if (!objectContents) {
            commit({
                type: "LoadFailed",
                payload: {detail: "The file contents are corrupted."}
            });
            return;
        }

        const files = objectContents.files;
        const savedState = objectContents.state;

        const majorVersion = (s: string) => s ? s.split(".")[0] : null;
        if (majorVersion(savedState.version) != majorVersion(currentHintVersion)) {
            commit({
                type: "LoadFailed",
                payload: {detail: "Unable to load file created by older version of the application."}
            });
            return;
        }

        if (!rootGetters.isGuest) {
            await (dispatch("projects/createProject", {name: state.projectName || null}, {root: true}));
            savedState.projects.currentProject = rootState.projects.currentProject;
            savedState.projects.currentVersion = rootState.projects.currentVersion;
        }

        await getFilesAndLoad(context, files, savedState);
    },

    async loadFromVersion(context, versionDetails) {
        const {commit} = context;
        commit({type: "SettingFiles", payload: null});

        const completeLoad = () => {
            getFilesAndLoad(context, versionDetails.files, JSON.parse(versionDetails.state));
        }

        if (router.currentRoute.path === "/") {
            completeLoad();
        } else {
            router.push("/", () => {
                completeLoad();
            })
        }
    },

    async updateStoreState(context, savedState) {
        //File hashes have now been set for session in backend, so we save the state from the file we're loading into local
        //storage then reload the page, to follow exactly the same fetch and reload procedure as session page refresh
        //NB load state is not included in the saved state, so we will default back to NotLoading on page reload.

        // Backwards compatibility fix: projects which calibrated before bug fix in mrc-3126 have empty calibrate options
        const {modelCalibrate} = savedState
        if (modelCalibrate?.result && Object.keys(modelCalibrate.options).length === 0) {
            savedState = {
                ...savedState,
                modelCalibrate: {...modelCalibrate, options: getCalibrateOptions(modelCalibrate)}
            }
        }

        localStorageManager.savePartialState(savedState, false);
        location.reload();
    },

    async clearLoadState({commit}) {
        commit({type: "LoadStateCleared", payload: null});
    },

    async preparingRehydrate(context, formData) {
        const {dispatch, commit} = context
        commit({type: "StartPreparingRehydrate", payload: null});
        const response = await api<LoadActionTypes, LoadErrorActionTypes>(context)
            .withSuccess("PreparingRehydrate")
            .withError("RehydrateResultError")
            .postAndReturn("rehydrate/submit", formData);

        if (response) {
            await dispatch("pollRehydrate");
        }
    },

    async pollRehydrate(context) {
        const {commit} = context;
        const id = setInterval(() => {
            getRehydrateStatus(context)
        }, 2000);

        commit({type: "RehydratePollingStarted", payload: id});
    }
};

const getRehydrateResult = async (context: ActionContext<LoadState, RootState>) => {
    const {rootGetters, state, dispatch, rootState} = context
    const rehydrateId = state.rehydrateId
    const response = await api<LoadActionTypes, LoadErrorActionTypes>(context)
        .withSuccess("RehydrateResult")
        .withError("RehydrateResultError")
        .get<ProjectRehydrateResultResponse>(`rehydrate/result/${rehydrateId}`);

    if (response && response.data) {
        const {files, savedState} = await constructRehydrateProjectState(context, response.data)

        if (!rootGetters.isGuest) {
            await dispatch("projects/createProject",
                {
                    name: state.projectName,
                    isUploaded: true
                }, {root: true});
                
            savedState.projects!.currentProject = rootState.projects.currentProject
            savedState.projects!.currentVersion = rootState.projects.currentVersion

            const newRootState = {...emptyState(), ...savedState}

            Object.assign(rootState, newRootState);
        }


        await getFilesAndLoad(context, files, savedState)
    }
}

const getRehydrateStatus = async (context: ActionContext<LoadState, RootState>) => {
    const rehydrateId = context.state.rehydrateId
    const response = await api<LoadActionTypes, LoadErrorActionTypes>(context)
        .withSuccess("RehydrateStatusUpdated")
        .withError("RehydrateResultError")
        .get<ModelStatusResponse>(`rehydrate/status/${rehydrateId}`);

    if (response && response.data.done) {
        await getRehydrateResult(context)
    }
}

async function getFilesAndLoad(context: ActionContext<LoadState, RootState>,
                               files: any,
                               savedState: Partial<RootState>) {
    console.log("DOING GET FILES AND LOAD")
    savedState.stepper!.steps = initialStepperState().steps
    const {dispatch, state} = context;
    await api<LoadActionTypes, LoadErrorActionTypes>(context)
        .withSuccess("UpdatingState")
        .withError("LoadFailed")
        .postAndReturn<Dict<LocalSessionFile>>("/session/files/", files)
        .then((response) => {
            if (response && response.data) {
                if (state.loadingState != LoadingState.LoadFailed) {
                    dispatch("updateStoreState", savedState);
                }
            }
        });
}

// getCalibrateOptions extracts calibrate options from Dynamic Form, this allows
// backward compatibility supports for calibrate option bug
const getCalibrateOptions = (modelCalibrate: ModelCalibrateState): DynamicFormData => {
    const allControlGroups = flatMapControlSections(modelCalibrate.optionsFormMeta.controlSections);
    return allControlGroups.reduce<DynamicFormData>((options, option): DynamicFormData => {
        option.controls.forEach(option => {
            options[option.name] = option.value || null
        })
        return options
    }, {})
}

