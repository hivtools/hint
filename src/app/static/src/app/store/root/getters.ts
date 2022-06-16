import {RootState} from "../../root";
import {Getter, GetterTree} from "vuex";
import {Error, ProjectState, VersionInfo, Warning} from "../../generated"
import {Dict, StepWarnings} from "../../types";
import {extractErrors} from "../../utils";
import {ModelCalibrateState} from "../modelCalibrate/modelCalibrate";
import {DynamicFormData} from "@reside-ic/vue-dynamic-form";

interface RootGetters {
    isGuest: Getter<RootState, RootState>
    warnings: Getter<RootState, RootState>
    projectState: Getter<RootState, RootState>
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

    projectState: (rootState: RootState): ProjectState => {
        return {
            datasets: {
                pjnz: {
                    path: `uploads/${rootState.baseline.pjnz?.hash}`,
                    filename: rootState.baseline.pjnz?.filename || ""
                },
                population: {
                    path: `uploads/${rootState.baseline.population?.hash}`,
                    filename: rootState.baseline.population?.filename || ""
                },
                shape: {
                    path: `uploads/${rootState.baseline.shape?.hash}`,
                    filename: rootState.baseline.shape?.filename || ""
                },
                survey: {
                    path: `uploads/${rootState.surveyAndProgram.survey?.hash}`,
                    filename: rootState.surveyAndProgram.survey?.filename || ""
                },
                programme: {
                    path: `uploads/${rootState.surveyAndProgram.program?.hash}`,
                    filename: rootState.surveyAndProgram.program?.filename || ""
                },
                anc: {
                    path: `uploads/${rootState.surveyAndProgram.anc?.hash}`,
                    filename: rootState.surveyAndProgram.anc?.filename || ""
                }
            },
            model_fit: {
                options: rootState.modelOptions.options || {},
                id: rootState.modelRun.modelRunId
            },
            calibrate: {
                options: getCalibrateOptions(rootState.modelCalibrate) || {},
                id: rootState.modelCalibrate.calibrateId
            },
            version: rootState.hintrVersion.hintrVersion as VersionInfo
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

// getCalibrateOptions extracts calibrate options from Dynamic Form, this allows
// backward compatibility supports with for rehydrating of calibrate option
const getCalibrateOptions = (modelCalibrate: ModelCalibrateState): DynamicFormData => {
    if (Object.keys(modelCalibrate.options).length) {
        return modelCalibrate.options
    }

    const section = modelCalibrate.optionsFormMeta.controlSections.find(section => section.controlGroups)
    return section?.controlGroups
        .reduce((options: DynamicFormData, option): DynamicFormData => {
            option.controls.forEach(option => {
                const name = option.name
                options[name] = option.value || null
            })
            return options
        }, {}) || {}
}
