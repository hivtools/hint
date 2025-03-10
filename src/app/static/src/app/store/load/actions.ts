import {ActionContext, ActionTree} from "vuex";
import {LoadingState, LoadState} from "./state";
import {emptyState, RootState} from "../../root";
import {api} from "../../apiService";
import {
    constructRehydrateProjectState,
    flatMapControlSections,
} from "../../utils";
import {DatasetResource, Dict, LocalSessionFile, VersionDetails} from "../../types";
import {localStorageManager} from "../../localStorageManager";
import {router} from "../../router";
import {initialStepperState} from "../stepper/stepper";
import {
    ModelStatusResponse,
    ProjectRehydrateResultResponse,
} from "../../generated";
import {DynamicFormData} from "@reside-ic/vue-next-dynamic-form";
import {ModelCalibrateState} from "../modelCalibrate/modelCalibrate";
import {LoadMutations} from "./mutations";
import {ProjectsMutations} from "../projects/mutations";

export type LoadErrorActionTypes = "LoadFailed" | "RehydrateResultError"
export type LoadActionTypes = keyof Omit<LoadMutations, LoadErrorActionTypes>

export interface LoadActions {
    preparingRehydrate: (store: ActionContext<LoadState, RootState>, file: FormData) => void
    preparingRehydrateFromAdr: (store: ActionContext<LoadState, RootState>, file: DatasetResource) => void
    loadFromVersion: (store: ActionContext<LoadState, RootState>, versionDetails: VersionDetails) => void
    updateStoreState: (store: ActionContext<LoadState, RootState>, savedState: Partial<RootState>) => void
    clearLoadState: (store: ActionContext<LoadState, RootState>) => void
    pollRehydrate: (store: ActionContext<LoadState, RootState>, interval?: number | null) => void
}

export const actions: ActionTree<LoadState, RootState> & LoadActions = {

    async loadFromVersion(context, versionDetails) {
        const {commit} = context;
        commit({type: "SettingFiles", payload: null});

        const completeLoad = () => {
            getFilesAndLoad(context, versionDetails.files, JSON.parse(versionDetails.state));
        };

        const home = "/";
        completeLoad();
        if (router.currentRoute.value.path !== home) {
            router.push(home);
        }
    },

    async updateStoreState(context, savedState) {
        //File hashes have now been set for session in backend, so we save the state from the file we're loading into local
        //storage then reload the page, to follow exactly the same fetch and reload procedure as session page refresh
        //NB load state is not included in the saved state, so we will default back to NotLoading on page reload.

        const compatibleState = migrateState(savedState);

        const {commit} = context;
        // Note that we can end up with a race condition here, if we save the partial state and then an action
        // completed in between the new project state being saved and the reload completing it can break the
        // state. So we commit a mutation to SetLoadingProject which will block any further mutations being committed
        commit({type: `projects/${ProjectsMutations.SetLoadingProject}`, payload: true}, {root:true});
        localStorageManager.savePartialState(compatibleState);
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

    async preparingRehydrateFromAdr(context, datasetResource) {
        const {dispatch, commit} = context
        commit({type: "StartPreparingRehydrate", payload: null});
        const response = await api<LoadActionTypes, LoadErrorActionTypes>(context)
            .withSuccess("PreparingRehydrate")
            .withError("RehydrateResultError")
            .postAndReturn("rehydrate/submit/adr", datasetResource);

        if (response) {
            await dispatch("pollRehydrate");
        }
    },

    async pollRehydrate(context, interval = null) {
        const {commit} = context;
        const id = setInterval(() => {
            getRehydrateStatus(context)
        }, interval || 2000);

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
        const {files, savedState} = constructRehydrateProjectState(response.data)

        if (!rootGetters.isGuest) {
            await dispatch("projects/createProject",
                {
                    name: state.newProjectName,
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

export enum Ordering {
    LESS, GREATER, EQUAL
}

export const getVersionOrdering = (version1: string, version2: string) => {
    const numericVersion1 = version1.split(".").map(parseInt);
    const numericVersion2 = version2.split(".").map(parseInt);

    for (let i = 0; i < 3; i++) {
        if (numericVersion1[i] < numericVersion2[i]) {
            return Ordering.LESS;
        }
        if (numericVersion1[i] > numericVersion2[i]) {
            return Ordering.GREATER;
        }
    }
    return Ordering.EQUAL;
};

const migrateState = (savedState: Partial<RootState>) => {
    if (!savedState.version || getVersionOrdering(savedState.version, "2.0.0") === Ordering.LESS) {
        // Backwards compatibility fix: projects which calibrated before bug fix in mrc-3126 have empty calibrate options
        const {modelCalibrate} = savedState;
        if (modelCalibrate?.result && Object.keys(modelCalibrate.options).length === 0) {
            savedState = {
                ...savedState,
                modelCalibrate: {...modelCalibrate, options: getCalibrateOptions(modelCalibrate)}
            }
        }
    }

    if (!savedState.version || getVersionOrdering(savedState.version, "2.39.1") === Ordering.LESS) {        
        // Backward compatibility fix: projects which calibrated before mrc-4538 have metadata embedded in result
        const {modelCalibrate} = savedState;
        if (modelCalibrate?.result) {
            savedState = {
                ...savedState,
                modelCalibrate: {
                    ...modelCalibrate,
                    warnings: modelCalibrate.result.warnings
                }
            }
        }
    }

    if (!savedState.version || getVersionOrdering(savedState.version, "3.8.0") === Ordering.LESS) {
        // Backwards compatibility fix: we changed the plot names in the plot refactoring epic mrc-4856 so we remove
        // modelOutput state where plot names were hardcoded in the selected tab field
        savedState.modelOutput = {
            selectedTab: "choropleth",
            loading: {
                bar: false,
                bubble: false,
                comparison: false,
                map: false,
                table: false
            }
        }
    }

    return savedState;
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
