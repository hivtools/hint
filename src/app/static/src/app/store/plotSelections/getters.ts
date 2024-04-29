import {ControlSelection, FilterSelection, PlotName, PlotSelectionsState} from "./plotSelections";
import {CalibratePlotRow, ChoroplethIndicatorMetadata, FilterOption} from "../../generated";
import {BarChartData, plotDataToChartData} from "../../components/plots/bar/utils";
import {RootState} from "../../root";
import {PlotData} from "../plotData/plotData";

export const getters = {
    controlSelectionFromId: (state: PlotSelectionsState) => (plotName: PlotName, controlId: string): FilterOption | undefined => {
        return state[plotName].controls.find((f: ControlSelection) => f.id === controlId)?.selection[0]
    },
    filterSelectionFromId: (state: PlotSelectionsState) => (plotName: PlotName, filterId: string): FilterOption[] => {
        const filterSelection = state[plotName].filters.find((f: FilterSelection) => f.stateFilterId === filterId);
        if (filterSelection === undefined) {
            return []
        } else {
            return filterSelection.selection
        }
    },
    chartData: (state: PlotSelectionsState, getters: any, rootState: RootState, rootGetters: any) =>
        (plotName: PlotName,  plotData: PlotData, indicatorMetadata: ChoroplethIndicatorMetadata,
         filterSelections: FilterSelection[]): BarChartData => {
        let disaggregateId;
        let xAxisId;
        let areaLevel;
        let disaggregateSelections;
        let xAxisSelections;
        let xAxisOptions;
        let areaIdToLevelMap;
        const emptyData = {datasets:[], labels: [], maxValuePlusError: 0} as BarChartData;
        if (plotName == "barchart") {
            const disaggregateBy = getters.controlSelectionFromId(plotName, "disagg_by");
            const xAxis = getters.controlSelectionFromId(plotName, "x_axis");
            if (!disaggregateBy || !xAxis) {
                return emptyData
            }
            disaggregateId = rootGetters["modelCalibrate/filterIdToColumnId"](disaggregateBy.id);
            xAxisId = rootGetters["modelCalibrate/filterIdToColumnId"](xAxis.id);
            areaLevel = filterSelections.find(f => f.filterId == "detail")?.selection[0]?.id;
            disaggregateSelections = getters.filterSelectionFromId(plotName, disaggregateBy.id);
            xAxisSelections = getters.filterSelectionFromId(plotName, xAxis.id);
            xAxisOptions = rootState.modelCalibrate.metadata!.filterTypes.find(f => f.id === xAxis!.id)!.options
            areaIdToLevelMap = rootGetters["baseline/areaIdToLevelMap"];
        } else if (plotName == "calibrate") {
            disaggregateId = "data_type";
            disaggregateSelections = [
                {id: "calibrated", label: "Calibrated"},
                {id: "raw", label: "Unadjusted"},
                {id: "spectrum", label: "Spectrum"}
            ] as FilterOption[];
            xAxisId = "spectrum_region_code";
            const xAxisMap: Map<string, FilterOption> = rootState.modelCalibrate.calibratePlotResult!.data
                .reduce((optsMap: Map<string, FilterOption>, row: CalibratePlotRow) => {
                    if (!optsMap.has(row.spectrum_region_code)) {
                        optsMap.set(row.spectrum_region_code, {id: row.spectrum_region_code, label: row.spectrum_region_name})
                    }
                    return optsMap;
                }, new Map<string, FilterOption>())
            xAxisSelections = [...xAxisMap.values()] as FilterOption[];
            xAxisOptions = xAxisSelections;
            areaLevel = null;
            areaIdToLevelMap = new Map();
        }
        if (disaggregateId && xAxisId && xAxisOptions && plotData) {
            const p = plotDataToChartData(plotData, indicatorMetadata,
                disaggregateId, disaggregateSelections,
                xAxisId, xAxisSelections, xAxisOptions,
                areaLevel, areaIdToLevelMap);
            return p
        } else {
            return emptyData
        }
    }
};
