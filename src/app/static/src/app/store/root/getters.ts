import {RootState} from "../../root";
import {Getter, GetterTree} from "vuex";
import {DownloadSubmitRequest, Error, Note, VersionInfo} from "../../generated"
import {Warning} from "../../generated";
import {Dict, StepWarnings, Version} from "../../types";
import {extractErrors, formatToLocalISODateTime} from "../../utils";

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

    projectState: (rootState: RootState): DownloadSubmitRequest => {
        const versions = rootState.projects.currentProject?.versions || []
        const name = rootState.projects.currentProject?.name || ""
        const getUpdatedDate = versions.length > 0 ? versions[0].updated : new Date().toUTCString()

        return {
            state: {
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
                    options: rootState.modelCalibrate.options || {},
                    id: rootState.modelCalibrate.calibrateId
                },
                version: rootState.hintrVersion.hintrVersion as VersionInfo
            },
            notes: {
                project_notes: {
                    name: name,
                    updated: formatToLocalISODateTime(getUpdatedDate),
                    note: rootState.projects.currentProject?.note || ""
                },
                version_notes: getVersionNotes(versions, name)
            },
            iso3: rootState.baseline.iso3
        }
    },

    projectIso3: (rootState: RootState): DownloadSubmitRequest => {
        return {
            iso3: rootState.baseline.iso3
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
    const reviewInputWarnings = state.reviewInput?.warnings || []
    return [...sapWarnings, ...reviewInputWarnings]
}

const getVersionNotes = (versions: Version[], projectName: string) => {
    return versions.reduce((result: Note[], versionNote) => {
        const note = versionNote.note || ""
        const updated = versions && formatToLocalISODateTime(versionNote.updated)

        return result.concat({note, updated, name: `${projectName}-v${versionNote.versionNumber}`})
    }, [])
}
