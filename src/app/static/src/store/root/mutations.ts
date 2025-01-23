import {MutationTree} from "vuex";
import {emptyState, RootState} from "../../root";
import {initialModelOptionsState} from "../modelOptions/modelOptions";
import {initialModelRunState} from "../modelRun/modelRun";
import {initialModelOutputState} from "../modelOutput/modelOutput";
import {initialLoadState} from "../load/state";
import {initialMetadataState} from "../metadata/metadata";
import {initialErrorsState} from "../errors/errors";
import {initialBaselineState} from "../baseline/baseline";
import {initialSurveyAndProgramState} from "../surveyAndProgram/surveyAndProgram";
import {PayloadWithType, PollingState, Project} from "../../types";
import {mutations as languageMutations} from "../language/mutations";
import {initialProjectsState} from "../projects/projects";
import {router} from "../../router"
import {initialModelCalibrateState} from "../modelCalibrate/modelCalibrate";
import {initialADRUploadState} from "../adrUpload/adrUpload";
import {initialDownloadResultsState} from "../downloadResults/downloadResults";
import {initialReviewInputState} from "../reviewInput/reviewInput";
import {initialPlotSelectionsState} from "../plotSelections/plotSelections";
import {initialPlotDataState} from "../plotData/plotData";
import {initialPlotState} from "../plotState/plotState";
import { DownloadType } from "../downloadResults/downloadConfig";

export enum RootMutation {
    Reset = "Reset",
    ResetOptions = "ResetOptions",
    ResetOutputs = "ResetOutputs",
    SetProject = "SetProject",
    ResetDownload = "ResetDownload",
    SetInvalidSteps = "SetInvalidSteps"
}

export const mutations: MutationTree<RootState> = {
    [RootMutation.Reset](state: RootState, action: PayloadWithType<number>) {

        const maxValidStep = action.payload;

        //We treat the final group of steps 5-7 together - all rely on modelCalibrate and its result. If we're calling Reset
        //at all we assume that these steps will be invalidated but earlier steps may be retainable
        const resetState: RootState = {
            version: state.version,
            hintrVersion: state.hintrVersion,
            language: state.language,
            updatingLanguage: false,
            invalidSteps: [],
            adr: state.adr,
            adrUpload: initialADRUploadState(),
            baseline: maxValidStep < 1 ? initialBaselineState() : state.baseline,
            metadata: maxValidStep < 1 ? initialMetadataState() : state.metadata,
            surveyAndProgram: maxValidStep < 2 ? initialSurveyAndProgramState() : state.surveyAndProgram,
            reviewInput: maxValidStep < 2 ? initialReviewInputState() : state.reviewInput,
            modelOptions: maxValidStep < 3 ? initialModelOptionsState() : state.modelOptions,
            modelRun: maxValidStep < 4 ? initialModelRunState() : state.modelRun,
            modelCalibrate: initialModelCalibrateState(),
            modelOutput: initialModelOutputState(),
            plotData: initialPlotDataState(),
            plotSelections: initialPlotSelectionsState(),
            plotState: initialPlotState(),
            stepper: state.stepper,
            load: initialLoadState(),
            errors: initialErrorsState(),
            projects: {
                ...initialProjectsState(),
                currentProject: state.projects.currentProject,
                currentVersion: state.projects.currentVersion
            },
            currentUser: state.currentUser,
            downloadResults: initialDownloadResultsState(),
        };
        Object.assign(state, resetState);

        const maxAccessibleStep = maxValidStep < 5 ? Math.max(maxValidStep, 1) : 5;
        if (state.stepper.activeStep > maxAccessibleStep) {
            state.stepper.activeStep = maxAccessibleStep;
        }

        state.surveyAndProgram.ready = true;
        state.baseline.ready = true;
        state.modelRun.ready = true;
        state.modelCalibrate.ready = true;
    },

    [RootMutation.SetProject](state: RootState, action: PayloadWithType<Project>) {
        const resetState: RootState = {
            ...emptyState(),
            language: state.language,
            hintrVersion: state.hintrVersion,
            adr: state.adr,
            reviewInput: initialReviewInputState(),
            projects: {
                ...initialProjectsState(),
                currentProject: action.payload,
                currentVersion: action.payload.versions[0]
            }
        };

        Object.assign(state, resetState);

        state.surveyAndProgram.ready = true;
        state.baseline.ready = true;
        state.modelRun.ready = true;
        state.modelCalibrate.ready = true;

        if (router.currentRoute.value.path !== "/") {
            router.push("/");
        }
    },

    [RootMutation.ResetOptions](state: RootState) {
        Object.assign(state.modelOptions, initialModelOptionsState());
    },

    [RootMutation.ResetDownload](state: RootState) {
        stopPollingAllDownloadTypes(state);
        Object.assign(state.downloadResults, initialDownloadResultsState());
    },

    [RootMutation.ResetOutputs](state: RootState) {
        stopPollingAllDownloadTypes(state);
        stopPolling(state.modelRun);
        stopPolling(state.modelCalibrate);
        Object.assign(state.modelRun, initialModelRunState());
        state.modelRun.ready = true;
        Object.assign(state.modelCalibrate, initialModelCalibrateState());
        state.modelCalibrate.ready = true;
        Object.assign(state.modelOutput, initialModelOutputState());
        Object.assign(state.adrUpload, initialADRUploadState());
        Object.assign(state.downloadResults, initialDownloadResultsState());
    },

    [RootMutation.SetInvalidSteps](state: RootState, action: PayloadWithType<number[]>) {
        state.invalidSteps = action.payload;
    },

    ...languageMutations

};

const stopPollingAllDownloadTypes = (state: RootState) => {
    Object.values(DownloadType).forEach(type => {
        stopPolling(state.downloadResults[type])
    });
};

const stopPolling = <T extends PollingState>(state: T) => {
    if (state.statusPollId === -1) {
        return
    }
    clearInterval(state.statusPollId);
    state.statusPollId = -1;
};
