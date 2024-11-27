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
    const { data } = rootState.reviewInput.datasets[dataSource];
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
    const plotDataPayload: PlotDataUpdate = {
        plot: payload.plot,
        data: filteredData
    };
    commit(`plotData/${PlotDataMutations.updatePlotData}`, { payload: plotDataPayload }, { root: true });
};

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

    // Filter the data on the current selections
    const metadata = getMetadataFromPlotName(rootState, payload.plot);
    const { filters } = payload.selections;
    const filterObject: Dict<(string| number)[]> = {};
    filters.forEach(f => {
        const filterType = metadata.filterTypes.find(ft => ft.id === f.filterId)!;
        filterObject[filterType.column_id] = f.selection.map(s => s.id);
    });
    const filteredData: InputComparisonData = [];
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

export const getPopulationFilteredData = async (payload: PlotSelectionUpdate, commit: Commit, rootState: RootState, rootGetters: any) => {
    const data =  rootState.baseline.population!.data

    if (!data) {
        return;
    }

    // Filter the data on the current selections
    // filteredData still contains data for all uploaded area levels, which is then handled in the aggregation logic below
    const { filters } = payload.selections;
    const { filterTypes } = getMetadataFromPlotName(rootState, payload.plot);
    const filteredData = filterData(filters, data, filterTypes);

    const selectedAreaLevel = Number(filters.find(f=>f.stateFilterId === 'area_level')?.selection[0].id) || 0;
    
    const areaIdToLevelMap: Dict<number> = rootGetters["baseline/areaIdToLevelMap"];

    const highestAreaLevel = Math.max(...new Set(Object.values(areaIdToLevelMap)));

    const allFeatureProperties = rootState.baseline.shape!.data.features.map(f=>f.properties);

    // Map of all feature area ids and their parent area id
    const parentMap: Dict<string> = allFeatureProperties.reduce((acc,cur)=>{
        acc[cur.area_id] = cur.parent_area_id
        return acc
    },{});

    // Returns an array of areaIds that make up the full parent chain for a given area id
    const getParentAreaIdChain = (areaId: string): string[] => {
        const parentAreaIds: string[] = [];
        let currentAreaId = parentMap[areaId];
      
        while (currentAreaId !== null) {
            parentAreaIds.push(currentAreaId);
            currentAreaId = parentMap[currentAreaId];
        }
      
        return parentAreaIds.reverse(); // Return in order from root to current
    };

    // Map of each indicator area id to their full parent chain
    const fullParentMap = allFeatureProperties.reduce((acc,cur)=>{
        acc[cur.area_id] = getParentAreaIdChain(cur.area_id)
        return acc
    },{})

    // Population data may be uploaded at multiple area levels. Check to see if there are existing indicators at 
    // the selected area level, and if so use them to initialize the aggregation.
    const existingIndicators = filteredData.filter(ind=>areaIdToLevelMap[ind.area_id] === selectedAreaLevel)

    const aggregatePopulationIndicators = () => {
        // Exclude any indicators at lower area levels from aggregation, i.e. exlude country level indicators when aggregating at region level)
        const indicatorsToAggregate = filteredData.filter(ind=>areaIdToLevelMap[ind.area_id] > selectedAreaLevel)
        return indicatorsToAggregate.reduce((acc, ind)=>{
            const {area_id, calendar_quarter, age_group, sex, population} = ind;
            const matchingParentId = fullParentMap[area_id][selectedAreaLevel];

            // Check to see if the corresponding parent was already uploaded in population data. 
            // If it was, it is used directly and we don't need to do any aggregation for it.
            const shouldAggregate = !existingIndicators.some(ind=>ind.area_id === matchingParentId)
            if (!shouldAggregate) return acc

            const existingIndicator = acc.find((indicator: any)=>indicator.area_id === matchingParentId && indicator.calendar_quarter === calendar_quarter && indicator.age_group === age_group && indicator.sex === sex)
            if (existingIndicator) {
                existingIndicator.population += population;
            } else {
                const name = allFeatureProperties.find(f=>f.area_id === matchingParentId)?.area_name;

                acc.push({
                    age_group,
                    area_name: name,
                    area_id: matchingParentId,
                    calendar_quarter,
                    population,
                    sex
                });
            }
            return acc
        }, [...existingIndicators]);
    }

    const newData = selectedAreaLevel === highestAreaLevel ? existingIndicators : aggregatePopulationIndicators()

    const plotDataPayload: PlotDataUpdate = {
        plot: payload.plot,
        data: newData
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
