import {
    CalibrateDataResponse,
    CalibratePlotData,
    ComparisonPlotData,
    InputComparisonData,
    InputTimeSeriesData,
    InputTimeSeriesRow,
    PopulationResponseData
} from "../../generated"
import { PlotName, plotNames } from "../plotSelections/plotSelections"
import { mutations } from "./mutations"

export type PopulationPyramidData = {
    data: PopulationResponseData;
    nationalLevelData: PopulationResponseData;
}

export type PlotData = CalibrateDataResponse["data"] | InputTimeSeriesData | CalibratePlotData | ComparisonPlotData | InputComparisonData | PopulationPyramidData;
export type TableData = CalibrateDataResponse["data"] | InputComparisonData;
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
