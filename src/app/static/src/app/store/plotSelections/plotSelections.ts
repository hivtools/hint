import {
    CalibrateMetadataResponse,
    CalibratePlotResponse,
    ComparisonPlotResponse,
    Error,
    FilterOption,
    FilterRef,
    InputComparisonResponse,
    PopulationResponseMetadata,
    ReviewInputFilterMetadataResponse
} from "../../generated";
import { mutations } from "./mutations";
import { actions } from "./actions";
import { getters } from "./getters";

export type OutputPlotName = keyof CalibrateMetadataResponse["plotSettingsControl"] |
    keyof ComparisonPlotResponse["metadata"]["plotSettingsControl"]
export type InputPlotName = keyof ReviewInputFilterMetadataResponse["plotSettingsControl"] |
    keyof InputComparisonResponse["metadata"]["plotSettingsControl"] | keyof PopulationResponseMetadata['plotSettingsControl']
export type CalibratePlotName = keyof CalibratePlotResponse["metadata"]["plotSettingsControl"]

export const outputPlotNames: OutputPlotName[] = ["choropleth", "barchart", "table", "comparison", "bubble", "cascade"];
export const inputPlotNames: InputPlotName[] = ["timeSeries", "inputChoropleth", "inputComparisonTable", "inputComparisonBarchart", 'population'];
export const calibratePlotName: CalibratePlotName = "calibrate";

export type PlotName = OutputPlotName | InputPlotName | CalibratePlotName
export const plotNames = [...outputPlotNames, ...inputPlotNames, calibratePlotName];

export enum PlotDataType { Output, TimeSeries, InputChoropleth, Calibrate, Comparison, InputComparison, Population}

export const plotNameToDataType: Record<PlotName, PlotDataType> = {
    barchart: PlotDataType.Output,
    bubble: PlotDataType.Output,
    choropleth: PlotDataType.Output,
    table: PlotDataType.Output,
    cascade: PlotDataType.Output,
    timeSeries: PlotDataType.TimeSeries,
    inputChoropleth: PlotDataType.InputChoropleth,
    calibrate: PlotDataType.Calibrate,
    comparison: PlotDataType.Comparison,
    inputComparisonBarchart: PlotDataType.InputComparison,
    inputComparisonTable: PlotDataType.InputComparison,
    population: PlotDataType.Population
}

export type FilterSelection = {
    multiple: boolean
    selection: FilterOption[],
    hidden: boolean
} & FilterRef

export type ControlSelection = {
    id: string,
    label: string,
    selection: FilterOption[]
}

export type PlotSelectionsState = {
    [P in PlotName]: {
        controls: ControlSelection[]
        filters: FilterSelection[]
    }
} & { error: Error }

export type PopulationChartDataset = {
    label: string,
    data: number[]
    backgroundColor: string,
    isOutline: boolean
    isMale: boolean
}

export type PopulationChartData = {
    title: string,
    datasets: PopulationChartDataset[]
}[]

export const initialPlotSelectionsState = (): PlotSelectionsState => {
    const emptySelections: PlotSelectionsState[PlotName] = { controls: [], filters: [] };
    const emptySelectionsArray = plotNames.map(plot => [plot, emptySelections]);
    return Object.fromEntries([...emptySelectionsArray, ["error", ""]]) as PlotSelectionsState;
}

export const plotSelections = {
    namespaced: true,
    state: initialPlotSelectionsState(),
    mutations,
    actions,
    getters
};
