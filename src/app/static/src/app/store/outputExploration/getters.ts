import {Getter, GetterTree} from "vuex";
import {OutputExplorationState} from "./outputExploration";
import {RootState} from "../../root";

interface OutputExploration {
    getProjectState : Getter<OutputExplorationState, RootState>,
    generateProjectState : Getter<OutputExplorationState, RootState>
}

export const getters: GetterTree<OutputExplorationState, RootState> & OutputExploration = {
    getProjectState: (state: OutputExplorationState, rootState: RootState) => {
        const refineState = {
            notes: {
                project_notes: {
                    name: rootState.projects.currentProject?.name,
                    note: rootState.projects.currentProject?.note,
                    sharedBy: rootState.projects.currentProject?.sharedBy
                },
                version_notes: rootState.projects.currentProject?.versions
            },
            state: {
                    datasets: {
                        pjnz:{
                            path:`uploads/${rootState.baseline.pjnz?.hash}`,
                            filename:rootState.baseline.pjnz?.filename
                        },
                        population:{
                            path:`uploads/${rootState.baseline.population?.hash}`,
                            filename:rootState.baseline.population?.filename
                        },
                        shape:{
                            path:`uploads/${rootState.baseline.shape?.hash}`,
                            filename:rootState.baseline.shape?.filename
                        },
                        survey:{
                            path:`uploads/${rootState.surveyAndProgram.survey?.hash}`,
                            filename:rootState.surveyAndProgram.survey?.filename
                        },
                        programme:{
                            path:`uploads/${rootState.surveyAndProgram.program?.hash}`,
                            filename:rootState.surveyAndProgram.program?.filename
                        },
                        anc: {
                            path:`uploads/${rootState.surveyAndProgram.anc?.hash}`,
                            filename:rootState.surveyAndProgram.anc?.filename
                        }
                    },
                    model_fit: {
                        options:  rootState.modelOptions.options || {},
                        id: rootState.modelRun.modelRunId || null
                    },
                    calibrate: {
                        options: rootState.modelCalibrate.options || {},
                        id: rootState.modelCalibrate.calibrateId || null
                    },
                    model_output: {
                        id: rootState.downloadResults.spectrum.downloadId || null
                    },
                    coarse_output: {
                        id: rootState.downloadResults.coarseOutput.downloadId || null
                    },
                    summary_report: {
                        id: rootState.downloadResults.summary.downloadId || null
                    },
                    comparison_report: {
                        id: rootState.downloadResults.comparison.downloadId || null
                    },
                    version: {
                        "hintr": "",
                        "naomi": "",
                        "rrq": "0.5.6",
                        "traduire": "0.0.6"
                    }
                }
            }

        return JSON.stringify(refineState);
    },
    generateProjectState: (state: OutputExplorationState) => {
        return JSON.stringify(state);
    }
}
