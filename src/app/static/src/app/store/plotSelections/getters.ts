import {
    ControlSelection,
    FilterSelection,
    PlotName,
    PlotSelectionsState,
    PopulationChartData,
    PopulationChartDataset
} from "./plotSelections";
import {IndicatorMetadata, FilterOption, PopulationResponseData} from "../../generated";
import {
    BarChartData,
    inputComparisonPlotDataToChartData,
    plotDataToChartData,
    sortDatasets
} from "../../components/plots/bar/utils";
import {RootState} from "../../root";
import {PlotData, PopulationPyramidData} from "../plotData/plotData";
import {Dict} from "../../types";
import {getMetadataFromPlotName} from "./actions";
import {AreaProperties} from "../baseline/baseline";
import {InputComparisonPlotData} from "../reviewInput/reviewInput";

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
            return inputComparisonPlotDataToChartData(plotData as InputComparisonPlotData, indicatorMetadata,
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
        let areaIdToPropertiesMap = {} as Dict<AreaProperties>;
        let areaLevel = null;
        if (plotName === "barchart" || plotName === "comparison" || plotName === "cascade") {
            areaIdToPropertiesMap = rootGetters["baseline/areaIdToPropertiesMap"];
            areaLevel = filterSelections.find(f => f.filterId == "detail")?.selection[0]?.id;
        }
        if (disaggregateId && xAxisId && xAxisOptions) {
            const data = plotDataToChartData(plotData, indicatorMetadata,
                disaggregateId, disaggregateSelections,
                xAxisId, xAxisSelections, xAxisOptions,
                areaLevel, areaIdToPropertiesMap);
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

    // Called with already filtered and aggregated PopulationResponseData, this getter transforms the table of
    // data into the format needed for chart js.
    populationChartData: (state: PlotSelectionsState, getters: any) =>
        (plotName: PlotName, plotData: PopulationPyramidData, ageGroups: FilterOption[]): PopulationChartData => {

        const plotType = getters.controlSelectionFromId(plotName, "plot");

        if (!plotType) {
          return [];
        }

        const isProportion = plotType.id === "population_proportion";

        const groupedData: Record<string, PopulationResponseData> = {};

        // Country data for stepped outline
        let countryData: PopulationChartDataset[] = []
        if (isProportion) {
            countryData = getSinglePopulationChartDataset({indicators: plotData.nationalLevelData, ageGroups, isOutline: true, isProportion})
        }

        // Group data by area_id
        plotData.data.forEach((ind: PopulationResponseData[0]) => {
          if (!groupedData[ind.area_id]) {
            groupedData[ind.area_id] = [];
          }
          groupedData[ind.area_id].push(ind);
        });

        return Object.values(groupedData).map((indicators) => {
          return {
            title: indicators[0].area_name,
            datasets: [
              ...getSinglePopulationChartDataset({ indicators, ageGroups, isOutline: false, isProportion}),
              ...(countryData),
            ],
          };
        });
    }
};

const getSinglePopulationChartDataset = ({
                                             indicators,
                                             ageGroups,
                                             isOutline,
                                             isProportion,
                                         }: {
    ageGroups: FilterOption[];
    indicators: PopulationResponseData;
    isOutline: boolean;
    isProportion: boolean;
}): PopulationChartDataset[] => {
    let femalePopulations: number[] = new Array(ageGroups.length).fill(0);
    let malePopulations: number[] = new Array(ageGroups.length).fill(0);

    indicators.forEach((item) => {
        const ageIndex = ageGroups.findIndex(
            (group) => group.id === item.age_group
        );
        if (ageIndex !== -1) {
            if (item.sex === "female") {
                femalePopulations[ageIndex] += item.population;
            } else if (item.sex === "male") {
                malePopulations[ageIndex] += item.population;
            }
        }
    });

    let totalFemale: number, totalMale:number;

    if (isProportion) {
        totalFemale = femalePopulations.reduce((acc,cur)=> acc+cur, 0);
        totalMale = malePopulations.reduce((acc,cur)=> acc+cur, 0);

        femalePopulations = femalePopulations.map(p=>p/totalFemale);
        malePopulations = malePopulations.map(p=>p/totalMale);
    }

    return [
        {
            label: "Female",
            data: femalePopulations,
            backgroundColor: isOutline ? PopulationColors.OUTLINE : PopulationColors.FEMALE,
            isOutline,
            isMale: false
        },
        {
            label: "Male",
            data: malePopulations.map((pop) => -pop), // Negate male values for the left side of the pyramid
            backgroundColor: isOutline ? PopulationColors.OUTLINE : PopulationColors.MALE,
            isOutline,
            isMale: true
        },
    ];
};

export const PopulationColors = Object.freeze({
    OUTLINE: "transparent",
    MALE: "#48b342",
    FEMALE: "#5c96c5"
});
