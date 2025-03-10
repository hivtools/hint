import { Commit } from "vuex";
import { RootState } from "../../root";
import { FilterSelection, OutputPlotName } from "../plotSelections/plotSelections";
import { PlotSelectionUpdate, PlotSelectionsMutations } from "../plotSelections/mutations";
import { api } from "../../apiService";
import {
    AncResponse,
    CalibrateDataResponse,
    CalibratePlotData,
    ComparisonPlotData,
    FilterTypes,
    InputComparisonData,
    InputTimeSeriesData,
    InputTimeSeriesRow,
    PopulationResponseData,
    ProgrammeResponse,
    SurveyResponse
} from "../../generated";
import { PlotDataMutations, PlotDataUpdate } from "./mutations";
import { ReviewInputMutation } from "../reviewInput/mutations";
import { ReviewInputDataset } from "../../types";
import { getMetadataFromPlotName } from "../plotSelections/actions";
import { InputTimeSeriesKey } from "./plotData";
import { Dict } from "@reside-ic/vue-next-dynamic-form";
import { SurveyAndProgramState } from "../surveyAndProgram/surveyAndProgram";
import {aggregatePopulation} from "./aggregate";
import {AreaProperties} from "../baseline/baseline";
import {InputComparisonPlotData} from "../reviewInput/reviewInput";

type FilteredDataContext = {
    commit: Commit,
    rootState: RootState
}

export const getOutputFilteredData = async (plot: OutputPlotName, selections: PlotSelectionUpdate["selections"]["filters"], context: FilteredDataContext) => {
    const { commit, rootState } = context;
    const filterTypes = rootState.modelCalibrate.metadata!.filterTypes;
    const dataFetchPayload: Record<string, string[]> = {};
    selections.forEach(sel => {
        const colId = filterTypes.find(f => f.id === sel.filterId)?.column_id;
        const opIds = sel.selection.map(s => s.id);
        if (!colId) {
            // This should never happen in a real app, but if we request
            // filters for a type not in the metadata then just don't filter on this
            return
        }
        if (colId in dataFetchPayload) {
            dataFetchPayload[colId] = [...dataFetchPayload[colId], ...opIds];
        } else {
            dataFetchPayload[colId] = opIds;
        }
    });

    const calibrateId = rootState.modelCalibrate.calibrateId;
    const response = await api<any, PlotSelectionsMutations>(context as any)
        .ignoreSuccess()
        .withError(PlotSelectionsMutations.setError)
        .freezeResponse()
        .postAndReturn<CalibrateDataResponse["data"]>(`calibrate/result/filteredData/${calibrateId}`, dataFetchPayload);
    
    if (response) {
        const data = response.data;
        commit(`plotData/${PlotDataMutations.updatePlotData}`, {
            payload: { plot, data } as PlotDataUpdate
        }, { root: true });
    }
};

export const getTimeSeriesFilteredDataset = async (payload: PlotSelectionUpdate, commit: Commit, rootState: RootState) => {
    commit(`reviewInput/${ReviewInputMutation.SetError}`, { payload: null }, { root: true });
    const dataSource = payload.selections.controls.find(c => c.id === "time_series_data_source")?.selection[0].id;
    if (!dataSource) {
        // If this error occurs it is probably because metadata from hintr is broken.
        const err = {
            error: "TIME_SERIES_DATASOURCE_MISSING",
            detail: "Failed to update time series, time series data source is missing. Please report this to a system administrator."
        }
        commit(`reviewInput/${ReviewInputMutation.SetError}`, { payload: err }, { root: true });
        return
    }
    // fetch dataset
    if (!(dataSource in rootState.reviewInput.datasets)) {
        const response = await api<ReviewInputMutation, ReviewInputMutation>({commit, rootState})
                            .ignoreSuccess()
                            .withError(ReviewInputMutation.SetError)
                            .freezeResponse()
                            .get(`chart-data/input-time-series/${dataSource}`);
        if (response) {
            const setDatasetPayload = {
                datasetId: dataSource,
                dataset: response.data
            };
            commit(`reviewInput/${ReviewInputMutation.SetDataset}`, { payload: setDatasetPayload }, { root: true });
            const data = response.data as ReviewInputDataset;
            commit(`reviewInput/${ReviewInputMutation.WarningsFetched}`, { payload: data.warnings }, { root: true });
        }
    }
    if (!(dataSource in rootState.reviewInput.datasets)) {
        // This should not happen, and if it does then something bad happened above and there should be an
        // error shown in the review inputs tab
        return
    }
    // filter
    const { data } = rootState.reviewInput.datasets[dataSource];
    const filteredData = filterTimeSeriesData(data, payload, rootState)
    const plotDataPayload: PlotDataUpdate = {
        plot: payload.plot,
        data: filteredData
    };
    commit(`plotData/${PlotDataMutations.updatePlotData}`, { payload: plotDataPayload }, { root: true });
};

export const filterTimeSeriesData = (data: ReviewInputDataset["data"], payload: PlotSelectionUpdate, rootState: RootState) => {
    const metadata = getMetadataFromPlotName(rootState, payload.plot);
    const { filters } = payload.selections;
    const filterObject: Record<InputTimeSeriesKey, (string| number)[]> = {} as any;
    filters.forEach(f => {
        const filterType = metadata.filterTypes.find(ft => ft.id === f.filterId);
        if (filterType) {
            filterObject[filterType.column_id as InputTimeSeriesKey] = filterType.column_id === "area_level" ?
                f.selection.map(s => parseInt(s.id)) :
                f.selection.map(s => s.id);
        }
    });
    const filteredData: InputTimeSeriesData = [];
    outer: for (let i = 0; i < data.length; i++) {
        const currRow = data[i] as unknown as InputTimeSeriesRow;
        for (const column_id in filterObject) {
            const key = column_id as InputTimeSeriesKey;
            if (!filterObject[key].includes(currRow[key] as string | number)) {
                continue outer;
            }
        }
        filteredData.push(currRow);
    }
    return filteredData
}

export const getCalibrateFilteredDataset = async (payload: PlotSelectionUpdate, commit: Commit, rootState: RootState) => {
    const calibratePlotResult = rootState.modelCalibrate.calibratePlotResult;
    if (!calibratePlotResult) {
        return;
    }
    const data = calibratePlotResult.data;

    // Filter the data on the current selections
    const metadata = getMetadataFromPlotName(rootState, payload.plot);
    const { filters } = payload.selections;
    const filterObject: Dict<(string| number)[]> = {};
    filters.forEach(f => {
        const filterType = metadata.filterTypes.find(ft => ft.id === f.filterId)!;
        filterObject[filterType.column_id] = f.selection.map(s => s.id);
    });
    const filteredData: CalibratePlotData = [];
    outer: for (let i = 0; i < data.length; i++) {
        const currRow = data[i];
        for (const column_id in filterObject) {
            // Filter values are always strings, so we cast the data to a string so the comparison works
            if (!filterObject[column_id].includes(currRow[column_id].toString())) {
                continue outer;
            }
        }
        filteredData.push(currRow);
    }
    const plotDataPayload: PlotDataUpdate = {
        plot: payload.plot,
        data: filteredData
    };
    commit(`plotData/${PlotDataMutations.updatePlotData}`, { payload: plotDataPayload }, { root: true });
};

export const getComparisonFilteredDataset = async (payload: PlotSelectionUpdate, commit: Commit, rootState: RootState) => {
    const comparisonPlotResult = rootState.modelCalibrate.comparisonPlotResult;
    if (!comparisonPlotResult) {
        return;
    }
    const data = comparisonPlotResult.data;

    // Filter the data on the current selections
    const metadata = getMetadataFromPlotName(rootState, payload.plot);
    const { filters } = payload.selections;
    const filterObject: Dict<(string| number)[]> = {};
    filters.forEach(f => {
        const filterType = metadata.filterTypes.find(ft => ft.id === f.filterId)!;
        filterObject[filterType.column_id] = f.selection.map(s => s.id);
    });
    const filteredData: ComparisonPlotData = [];
    outer: for (let i = 0; i < data.length; i++) {
        const currRow = data[i];
        for (const column_id in filterObject) {
            // Filter values are always strings, so we cast the data to a string so the comparison works
            if (!filterObject[column_id].includes(currRow[column_id].toString())) {
                continue outer;
            }
        }
        filteredData.push(currRow);
    }
    const plotDataPayload: PlotDataUpdate = {
        plot: payload.plot,
        data: filteredData
    };
    commit(`plotData/${PlotDataMutations.updatePlotData}`, { payload: plotDataPayload }, { root: true });
};

const dataSourceToState: Record<string, keyof SurveyAndProgramState> = {
    survey: "survey",
    anc: "anc",
    programme: "program"
}

export const getInputChoroplethFilteredData = async (payload: PlotSelectionUpdate, commit: Commit, rootState: RootState) => {
    const dataSource = payload.selections.controls.find(c => c.id === "input_choropleth_data_source")!.selection[0].id;
    const response = rootState.surveyAndProgram[dataSourceToState[dataSource]];
    if (!response) {
        const plotDataPayload: PlotDataUpdate = {
            plot: "inputChoropleth",
            data: []
        };
        commit(`plotData/${PlotDataMutations.updatePlotData}`, { payload: plotDataPayload }, { root: true });
        return
    }
    const { filters } = payload.selections;
    const { data } = response as SurveyResponse | AncResponse | ProgrammeResponse;
    const { filterTypes } = getMetadataFromPlotName(rootState, payload.plot);
    const filteredData = filterData(filters, data, filterTypes);
    const plotDataPayload: PlotDataUpdate = {
        plot: payload.plot,
        data: filteredData
    };
    commit(`plotData/${PlotDataMutations.updatePlotData}`, { payload: plotDataPayload }, { root: true });
};

export const getInputComparisonFilteredData = async (payload: PlotSelectionUpdate, commit: Commit, rootState: RootState) => {
    const comparisonPlotResponse = rootState.reviewInput.inputComparison.data;
    if (!comparisonPlotResponse) {
        return;
    }
    const data: InputComparisonData = comparisonPlotResponse.data;
    // We're assuming here that ANC and ART indicators will always be mutually exclusive
    const artIndicators = new Set(data["art"].map(row => row.indicator));

    // Filter the data on the current selections
    const metadata = getMetadataFromPlotName(rootState, payload.plot);
    const { filters } = payload.selections;
    const selectedIndicator = filters.find(f => f.filterId === "indicator")?.selection[0].id;
    if (!selectedIndicator) {
        return;
    }
    const filterObject: Dict<(string| number)[]> = {};
    filters.forEach(f => {
        const filterType = metadata.filterTypes.find(ft => ft.id === f.filterId)!;
        filterObject[filterType.column_id] = f.selection.map(s => s.id);
    });
    let dataToFilter: InputComparisonPlotData;
    if (artIndicators.has(selectedIndicator)) {
        dataToFilter = data["art"];
        commit(`reviewInput/${ReviewInputMutation.SetInputComparisonDataSource}`, { payload: "art" }, { root: true });
    } else {
        dataToFilter = data["anc"];
        commit(`reviewInput/${ReviewInputMutation.SetInputComparisonDataSource}`, { payload: "anc" }, { root: true });
    }
    const filteredData: InputComparisonPlotData = [];
    outer: for (let i = 0; i < dataToFilter.length; i++) {
        const currRow = dataToFilter[i];
        for (const column_id in filterObject) {
            // Filter values are always strings, so we cast the data to a string so the comparison works
            if (!filterObject[column_id].includes(currRow[column_id].toString())) {
                continue outer;
            }
        }
        // We know this will be the same type as dataToFilter, but typescript not smart enough
        // to know this, so just cast as any to bypass the error
        filteredData.push(currRow as any);
    }
    const plotDataPayload: PlotDataUpdate = {
        plot: payload.plot,
        data: filteredData
    };
    commit(`plotData/${PlotDataMutations.updatePlotData}`, { payload: plotDataPayload }, { root: true });
};

export const getPopulationFilteredData = async (payload: PlotSelectionUpdate, commit: Commit, rootState: RootState, rootGetters: any) => {
    const data =  rootState.baseline.population?.data

    if (!data) {
        const plotDataPayload: PlotDataUpdate = {
            plot: payload.plot,
            data: []
        };

        commit(`plotData/${PlotDataMutations.updatePlotData}`, { payload: plotDataPayload }, { root: true });
        return;
    }

    // Filter the data on the current selections. The raw data has no area_level column so the
    // filteredData still contains data for all uploaded area levels. Setting the area filter is
    // handled in the area aggregation logic below
    // We want to show national proportions too, to calculate this we need to remove any specific area level filter,
    // but we still want to filter on all other items e.g. calendar quarter.
    const { filters } = payload.selections;
    const { filterTypes } = getMetadataFromPlotName(rootState, payload.plot);
    const nonAreaFilter = filters.filter((f: FilterSelection) => f.filterId !== "area")
    const areaFilter = filters.filter((f: FilterSelection) => f.filterId === "area")
    const allAreaData = filterData(nonAreaFilter, data, filterTypes);
    const filteredData: PopulationResponseData = filterData(areaFilter, allAreaData, filterTypes);

    const selectedAreaLevel = Number(filters.find(f=>f.stateFilterId === 'area_level')?.selection[0].id) || 0;
    const areaIdToPropertiesMap: Dict<AreaProperties> = rootGetters["baseline/areaIdToPropertiesMap"];
    const areaIdToParentPath: Dict<string[]> = rootGetters["baseline/areaIdToParentPath"];
    const aggregatedData = aggregatePopulation(filteredData, selectedAreaLevel,
        areaIdToPropertiesMap, areaIdToParentPath)

    aggregatedData.sort((a, b) =>
        areaIdToPropertiesMap[a.area_id].area_sort_order - areaIdToPropertiesMap[b.area_id].area_sort_order
    )

    const nationalData = aggregatePopulation(allAreaData, 0, areaIdToPropertiesMap, areaIdToParentPath);

    const plotDataPayload: PlotDataUpdate = {
        plot: payload.plot,
        data: {
            data: aggregatedData,
            nationalLevelData: nationalData
        },
    };
      
    commit(`plotData/${PlotDataMutations.updatePlotData}`, { payload: plotDataPayload }, { root: true });
}

const filterData = (filters: FilterSelection[], data: any[], filterTypes: FilterTypes[]) => {
    const filterObject: Record<string, (string| number)[]> = {} as any;
    filters.forEach(f => {
        const filterType = filterTypes.find(ft => ft.id === f.filterId)!;
        if (filterType) {
            filterObject[filterType.column_id] = filterType.column_id === "area_level" || filterType.column_id === "year" ?
                f.selection.map(s => parseInt(s.id)) :
                f.selection.map(s => s.id);
        }
    });
    const filteredData: typeof data = [];
    const dataKeys = data.length === 0 ? [] : Object.keys(data[0]);
    const filterableKeys = dataKeys.filter(key => Object.keys(filterObject).includes(key));
    if (filterableKeys.length === 0) return data;
    outer: for (let i = 0; i < data.length; i++) {
        const currRow = data[i];
        for (let j = 0; j < filterableKeys.length; j++) {
            const column_id = filterableKeys[j];
            if (!filterObject[column_id].includes(currRow[column_id])) continue outer;
        }
        filteredData.push(currRow);
    }
    return filteredData;
};
