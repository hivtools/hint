import { ActionContext, ActionTree, Commit } from "vuex"
import { OutputPlotName, PlotDataType, PlotName, PlotSelectionsState, plotNameToDataType } from "./plotSelections"
import { RootState } from "../../root"
import { GenericChartDataset, PayloadWithType } from "../../types"
import { CalibrateDataResponse, FilterOption, PlotSettingOption } from "../../generated"
import { PlotSelectionUpdate, PlotSelectionsMutations } from "./mutations"
import { filtersInfoFromPlotSettings, getPlotData } from "./utils"
import { api } from "../../apiService"
import { PlotDataMutations, PlotDataUpdate } from "../plotData/mutations"
import { PlotMetadataFrame } from "../metadata/metadata"
import { GenericChartMutation } from "../genericChart/mutations"

type Selection = {
    filter: {
        filterId: string,
        options: FilterOption[]
    }
} | {
    plotSetting: {
        id: string,
        options: FilterOption[]
    }
}

export type PlotSelectionActionUpdate = {
    plot: PlotName,
    selection: Selection
}

export type PlotSelectionsActions = {
    updateSelections: (store: ActionContext<PlotSelectionsState, RootState>, payload: PayloadWithType<PlotSelectionActionUpdate>) => void
}

export const getMetadataFromPlotName = (rootState: RootState, plotName: PlotName): PlotMetadataFrame => {
    const plotDataType = plotNameToDataType[plotName];
    switch(plotDataType) {
        case PlotDataType.Output: return rootState.modelCalibrate.metadata!;
        case PlotDataType.Input: return rootState.metadata.reviewInputMetadata!;
        case PlotDataType.TimeSeries: return rootState.metadata.reviewInputMetadata!;
    }
}

export const actions: ActionTree<PlotSelectionsState, RootState> & PlotSelectionsActions = {
    async updateSelections(context, payload) {
        const { plot, selection } = payload.payload;
        const { state, commit, rootState } = context;
        const metadata = getMetadataFromPlotName(rootState, plot);
        const updatedSelections: PlotSelectionsState[PlotName]  = {...state[plot]};
        if ("filter" in selection) {
            const fIndex = updatedSelections.filters.findIndex(f => f.stateFilterId === selection.filter.filterId);
            updatedSelections.filters[fIndex].selection = selection.filter.options;
        } else {
            const pIndex = updatedSelections.controls.findIndex(p => p.id === selection.plotSetting.id);
            updatedSelections.controls[pIndex].selection = selection.plotSetting.options;
            const plotSettingOptions: PlotSettingOption[] = updatedSelections.controls.map(c => {
                const plotSetting = metadata.plotSettingsControl[plot].plotSettings.find(ps => ps.id === c.id);
                return plotSetting!.options.find(op => op.id === c.selection[0].id)!;
            });
            const filtersInfo = filtersInfoFromPlotSettings(plotSettingOptions, plot, rootState, metadata);
            updatedSelections.filters = filtersInfo;
        }

        const updatePayload = { plot, selections: updatedSelections } as PlotSelectionUpdate;
        await getPlotData(updatePayload, commit, rootState);

        commit({
            type: PlotSelectionsMutations.updatePlotSelection,
            payload: updatePayload
        });
    }
}

type FilteredDataContext = {
    commit: Commit,
    rootState: RootState
}

export const getFilteredData = async (plot: OutputPlotName, selections: PlotSelectionUpdate["selections"]["filters"], context: FilteredDataContext) => {
    const { commit, rootState } = context;
    const filterTypes = rootState.modelCalibrate.metadata!.filterTypes;
    const dataFetchPayload: Record<string, string[]> = {};
    selections.forEach(sel => {
        const colId = filterTypes.find(f => f.id === sel.filterId)!.column_id;
        const opIds = sel.selection.map(s => s.id);
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
    commit(`genericChart/${GenericChartMutation.SetError}`, { payload: null }, { root: true });
    const dataSource = payload.selections.controls.find(c => c.id === "time_series_data_source")!.selection[0].id;
    // fetch dataset
    if (!(dataSource in rootState.genericChart.datasets)) {
        const response = await api<GenericChartMutation, GenericChartMutation>({commit, rootState})
                            .ignoreSuccess()
                            .withError(GenericChartMutation.SetError)
                            .freezeResponse()
                            .get(`chart-data/input-time-series/${dataSource}`);
        if (response) {
            const setDatasetPayload = {
                datasetId: dataSource,
                dataset: response.data
            };
            commit(`genericChart/${GenericChartMutation.SetDataset}`, { payload: setDatasetPayload }, { root: true });
            const data = response.data as GenericChartDataset;
            commit(`genericChart/${GenericChartMutation.WarningsFetched}`, { payload: data.warnings }, { root: true });
        }
    }
    // filter
    const metadata = getMetadataFromPlotName(rootState, payload.plot);
    const { filters } = payload.selections;
    const filterObject: Record<string, (string| number)[]> = {};
    filters.forEach(f => {
        const filterType = metadata.filterTypes.find(ft => ft.id === f.filterId)!;
        filterObject[filterType.column_id] = filterType.column_id === "area_level" ?
            f.selection.map(s => parseInt(s.id)) :
            f.selection.map(s => s.id);
    });
    const { data } = rootState.genericChart.datasets[dataSource];
    const filteredData: Record<string, string | number>[] = [];
    outer: for (let i = 0; i < data.length; i++) {
        const currRow = data[i] as Record<string, string | number>;
        for (const column_id in filterObject) {
            if (!filterObject[column_id].includes(currRow[column_id])) {
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
