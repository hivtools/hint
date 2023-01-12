import {DataType} from "../surveyAndProgram/surveyAndProgram";
import {ScaleSelections, PlottingSelectionsState} from "./plottingSelections";
import {DataExplorationState} from "../dataExploration/dataExploration";
import {DownloadPlotData} from "../../types";
import {exportService} from "../../DataExportService";

export const getters = {
    selectedSAPColourScales: (state: PlottingSelectionsState, getters: any, rootState: DataExplorationState): ScaleSelections => {
        const dataType = rootState.surveyAndProgram.selectedDataType;
        switch (dataType) {
            case DataType.Survey:
                return state.colourScales.survey;
            case DataType.ANC:
                return state.colourScales.anc;
            case DataType.Program:
                return state.colourScales.program;
            default:
                return {}
        }
    },

    downloadFile: () => (data: DownloadPlotData): void => {
        exportService(data)
            .addUnfilteredData()
            .addFilteredData()
            .download()
    }
};
