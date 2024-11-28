import {ControlSelection, FilterSelection, PlotName, PlotSelectionsState} from "./plotSelections";
import {IndicatorMetadata, FilterOption, InputComparisonData, PopulationResponseData} from "../../generated";
import {
    BarChartData,
    inputComparisonPlotDataToChartData,
    plotDataToChartData,
    sortDatasets
} from "../../components/plots/bar/utils";
import {RootState} from "../../root";
import {PlotData} from "../plotData/plotData";
import {Dict} from "../../types";
import {getMetadataFromPlotName} from "./actions";
import { getSinglePopulationChartDataset } from "../../components/plots/population/utils";

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

    barchartData: (state: PlotSelectionsState, getters: any, rootState: RootState, rootGetters: any) =>
        (plotName: PlotName, plotData: PlotData, indicatorMetadata: IndicatorMetadata,
         filterSelections: FilterSelection[], currentLanguage: string): BarChartData => {

        const metadata = getMetadataFromPlotName(rootState, plotName);
        if (plotName === "inputComparisonBarchart") {
            const xAxisId = "year";
            const xAxisSelections = getters.filterSelectionFromId(plotName, xAxisId);
            const xAxisOptions = metadata.filterTypes.find(f => f.id === xAxisId)!.options;
            return inputComparisonPlotDataToChartData(plotData as InputComparisonData, indicatorMetadata,
                xAxisId, xAxisSelections, xAxisOptions, currentLanguage)
        }
        const disaggregateBy = getters.controlSelectionFromId(plotName, "disagg_by");
        const xAxis = getters.controlSelectionFromId(plotName, "x_axis");
        const emptyData = {datasets:[], labels: [], maxValuePlusError: 0} as BarChartData;
        if (!disaggregateBy || !xAxis) {
            return emptyData
        }
        const disaggregateId = rootGetters["modelCalibrate/filterIdToColumnId"](plotName, disaggregateBy.id);
        const xAxisId = rootGetters["modelCalibrate/filterIdToColumnId"](plotName, xAxis.id);
        const disaggregateSelections = getters.filterSelectionFromId(plotName, disaggregateBy.id);
        const xAxisSelections = getters.filterSelectionFromId(plotName, xAxis.id);
        const xAxisOptions = metadata.filterTypes.find(f => f.id === xAxis!.id)!.options;
        // For calibrate barchart we never have detail level on the x-axis as it is fixed. So we
        // can just keep these as empty.
        let areaIdToLevelMap = {} as Dict<number>;
        let areaLevel = null;
        if (plotName === "barchart" || plotName === "comparison" || plotName === "cascade") {
            areaIdToLevelMap = rootGetters["baseline/areaIdToLevelMap"];
            areaLevel = filterSelections.find(f => f.filterId == "detail")?.selection[0]?.id;
        }
        if (disaggregateId && xAxisId && xAxisOptions) {
            const data = plotDataToChartData(plotData, indicatorMetadata,
                disaggregateId, disaggregateSelections,
                xAxisId, xAxisSelections, xAxisOptions,
                areaLevel, areaIdToLevelMap);
            if (plotName === "cascade") {
                // This is a bit ugly that it is here...
                // In general this code is becoming a bit hard to follow, perhaps worth refactoring at some point?
                // We want to sort the datasets here based on the order in the disaggregate selections
                // The data is fetched in the order of the filter, and then shown in this order. This is fine for
                // most plots but we want to override the order here and hard code it so that the indicators are shown
                // in the order specified in the "cascade" instead of in the default indicator order
                const indicatorOrder = rootGetters["modelCalibrate/cascadePlotIndicators"];
                sortDatasets(data.datasets, disaggregateSelections, indicatorOrder)
            }
            return data
        } else {
            return emptyData
        }
    },

    populationChartData: (state: PlotSelectionsState, getters: any) =>
        (plotName: PlotName, plotData: PopulationResponseData, ageGroups: FilterOption[]) => {

        const plotType = getters.controlSelectionFromId(plotName, "plot");

        if (!plotType) {
          return [];
        }

        const isProportion = plotType.id === "population_proportion";

        const groupedData: Record<string, PopulationResponseData> = {};

        // Country data for stepped outline
        const countryData = getSinglePopulationChartDataset({indicators: plotData, ageGroups, isOutline: true, isProportion});

        // Group data by area_id
        plotData.forEach((ind: PopulationResponseData[0]) => {
          if (!groupedData[ind.area_id]) {
            groupedData[ind.area_id] = [];
          }
          groupedData[ind.area_id].push(ind);
        });

        const result = Object.values(groupedData).map((indicators) => {
          return {
            title: indicators[0].area_name,
            datasets: [
              ...getSinglePopulationChartDataset({ indicators, ageGroups, isOutline: false, isProportion}),
              ...(isProportion ? countryData : []),
            ],
          };
        });

        return result;
    }
};
