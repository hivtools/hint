import {
    CalibrateDataResponse,
    CalibratePlotData,
    ComparisonPlotData,
    InputTimeSeriesData,
    InputTimeSeriesRow,
    PopulationResponseData
} from "../../generated"
import { PlotName, plotNames } from "../plotSelections/plotSelections"
import { mutations } from "./mutations"
import {InputComparisonPlotData} from "../reviewInput/reviewInput";

export type PopulationPyramidData = {
    data: PopulationResponseData;
    nationalLevelData: PopulationResponseData;
}

export type PlotData = CalibrateDataResponse["data"] | InputTimeSeriesData | CalibratePlotData | ComparisonPlotData | InputComparisonPlotData | PopulationPyramidData;
export type TableData = CalibrateDataResponse["data"] | InputComparisonPlotData;
export type InputTimeSeriesKey = keyof InputTimeSeriesRow;
export type PlotDataState = {
    [P in PlotName]: PlotData
}

export const initialPlotDataState = (): PlotDataState => {
    const data: PlotData = []
    return Object.fromEntries(plotNames.map(plot => [plot, data])) as PlotDataState;
}

export const plotData = {
    namespaced: true,
    state: initialPlotDataState(),
    mutations
}
