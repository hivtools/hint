import {RootState} from "../../root";
import {Getter, GetterTree} from "vuex";
import {Error, VersionInfo} from "../../generated"
import {Warning} from "../../generated";
import {Dict, StepWarnings} from "../../types";
import {extractErrors} from "../../utils";

interface RootGetters {
    isGuest: Getter<RootState, RootState>
    warnings: Getter<RootState, RootState>
    projectOutput: Getter<RootState, RootState>
}

const warningStepLocationMapping: Dict<string> = {
    modelOptions: "model_options",
    fitModel: "model_fit",
    calibrateModel: "model_calibrate",
    reviewOutput: "review_output",
    downloadResults: "download_results",
    reviewInputs: "review_inputs",
};

export const getters: RootGetters & GetterTree<RootState, RootState> = {
    isGuest: (state: RootState) => {
        return state.currentUser == "guest";
    },

    projectOutput: (rootState: RootState) => {
        return {
            state: {
                datasets: {
                    pjnz: {
                        path: `uploads/${rootState.baseline.pjnz?.hash}`,
                        filename: rootState.baseline.pjnz?.filename
                    },
                    population: {
                        path: `uploads/${rootState.baseline.population?.hash}`,
                        filename: rootState.baseline.population?.filename
                    },
                    shape: {
                        path: `uploads/${rootState.baseline.shape?.hash}`,
                        filename: rootState.baseline.shape?.filename
                    },
                    survey: {
                        path: `uploads/${rootState.surveyAndProgram.survey?.hash}`,
                        filename: rootState.surveyAndProgram.survey?.filename
                    },
                    programme: {
                        path: `uploads/${rootState.surveyAndProgram.program?.hash}`,
                        filename: rootState.surveyAndProgram.program?.filename
                    },
                    anc: {
                        path: `uploads/${rootState.surveyAndProgram.anc?.hash}`,
                        filename: rootState.surveyAndProgram.anc?.filename
                    }
                },
                model_fit: {
                    options: rootState.modelOptions.options || {},
                    id: rootState.modelRun.modelRunId
                },
                calibrate: {
                    options: rootState.modelCalibrate.options || {},
                    id: rootState.modelCalibrate.calibrateId
                },
                model_output: {
                    id: rootState.downloadResults.spectrum.downloadId
                },
                coarse_output: {
                    id: rootState.downloadResults.coarseOutput.downloadId
                },
                summary_report: {
                    id: rootState.downloadResults.summary.downloadId
                },
                comparison_report: {
                    id: rootState.downloadResults.comparison.downloadId
                },
                version: rootState.hintrVersion.hintrVersion as VersionInfo
            }
        }
    },

    errors: (state: RootState) => {
        const {
            adr,
            adrUpload,
            baseline,
            downloadResults,
            load,
            metadata,
            modelCalibrate,
            modelOptions,
            modelOutput,
            plottingSelections,
            projects,
            surveyAndProgram
        } = state;

        return ([] as Error[]).concat.apply([] as Error[], [extractErrors(adr),
            extractErrors(adrUpload),
            extractErrors(baseline),
            extractErrors(downloadResults),
            extractErrors(load),
            extractErrors(metadata),
            extractErrors(modelCalibrate),
            extractErrors(modelOptions),
            extractErrors(modelOutput),
            extractErrors(plottingSelections),
            extractErrors(projects),
            extractErrors(surveyAndProgram),
            state.modelRun.errors,
            state.errors.errors]);
    },
    warnings: (state: RootState) => (stepName: string): StepWarnings => {
        const filterWarnings = (warnings: Warning[], stepLocation: string) =>
            stepLocation ?
                (warnings || []).filter(warning => warning.locations.some(location => location === stepLocation)) :
                [];

        const location = warningStepLocationMapping[stepName];

        return {
            modelOptions: filterWarnings(state.modelOptions.warnings, location),
            modelRun: filterWarnings(state.modelRun.warnings, location),
            modelCalibrate: filterWarnings(state.modelCalibrate.warnings, location),
            reviewInputs: filterWarnings(allReviewInputsWarnings(state), location)
        }
    }
}

const allReviewInputsWarnings = (state: RootState) => {
    const sapWarnings = state.surveyAndProgram?.warnings || []
    const genericChartWarnings = state.genericChart?.warnings || []
    return [...sapWarnings, ...genericChartWarnings]
}

