import {ActionContext, ActionTree} from "vuex"
import {ControlSelection, PlotDataType, PlotName, plotNameToDataType, PlotSelectionsState} from "./plotSelections"
import {RootState} from "../../root"
import {Dict, PayloadWithType} from "../../types"
import {FilterOption, PlotSettingEffect, PlotSettingOption,} from "../../generated"
import {PlotSelectionsMutations, PlotSelectionUpdate} from "./mutations"
import {filtersInfoFromEffects, getPlotData} from "./utils"
import {PlotMetadataFrame} from "../metadata/metadata"

type IdOptions = {
    id: string,
    options: FilterOption[]
}

type FiltersSelection = { filters: IdOptions[] }
type PlotSettingSelection = { plotSetting: IdOptions }
export type Selection = FiltersSelection | PlotSettingSelection

export type PlotSelectionActionUpdate = {
    plot: PlotName,
    selection: Selection
}

export type PlotSelectionsActions = {
    updateSelections: (store: ActionContext<PlotSelectionsState, RootState>, payload: PayloadWithType<PlotSelectionActionUpdate>) => void
}

export const getMetadataFromPlotName = (rootState: RootState, plotName: PlotName): PlotMetadataFrame => {
    const plotDataType = plotNameToDataType[plotName];
    switch (plotDataType) {
        case PlotDataType.Output:
            return rootState.modelCalibrate.metadata!;
        case PlotDataType.InputChoropleth:
            return rootState.metadata.reviewInputMetadata!;
        case PlotDataType.TimeSeries:
            return rootState.metadata.reviewInputMetadata!;
        case PlotDataType.Calibrate:
            return rootState.modelCalibrate.calibratePlotResult!.metadata;
        case PlotDataType.Comparison:
            return rootState.modelCalibrate.comparisonPlotResult!.metadata;
        case PlotDataType.InputComparison:
            return rootState.reviewInput.inputComparison.data!.metadata;
        case PlotDataType.Population:
            return rootState.reviewInput.population.data!;
    }
}

export const getDefaultFilterSelections = (rootState: RootState, plotName: PlotName, controls: ControlSelection[]) => {
    const metadata = getMetadataFromPlotName(rootState, plotName);
    const plotMetadata = metadata.plotSettingsControl[plotName];
    const plotSettingOptions: PlotSettingOption[] = controls.map(c => {
        const plotSetting = plotMetadata.plotSettings.find(ps => ps.id === c.id);
        return plotSetting!.options.find(op => op.id === c.selection[0].id)!;
    });
    const effects: PlotSettingEffect[] = plotMetadata.defaultEffect ? [plotMetadata.defaultEffect] : [];
    plotSettingOptions.forEach(pso => effects.push(pso.effect));
    return filtersInfoFromEffects(effects, rootState, metadata);
};

export const actions: ActionTree<PlotSelectionsState, RootState> & PlotSelectionsActions = {
    async updateSelections(context, payload) {
        const {plot, selection} = payload.payload;
        const {state, commit, rootState, rootGetters} = context;
        const metadata = getMetadataFromPlotName(rootState, plot);
        const updatedSelections: PlotSelectionsState[PlotName] = structuredClone(state[plot]);
        if ("filters" in selection) {
            selection.filters.forEach(singleFilter => {
                const fIndex = updatedSelections.filters.findIndex(f => f.stateFilterId === singleFilter.id);
                updatedSelections.filters[fIndex].selection = singleFilter.options;
            });
        } else {
            const pIndex = updatedSelections.controls.findIndex(p => p.id === selection.plotSetting.id);
            updatedSelections.controls[pIndex].selection = selection.plotSetting.options;
            handlePlotControlOverrides(updatedSelections, plot, selection, metadata);
            updatedSelections.filters = getDefaultFilterSelections(rootState, plot, updatedSelections.controls);
        }

        const updatePayload = {plot, selections: updatedSelections} as PlotSelectionUpdate;
        await getPlotData(updatePayload, commit, rootState, rootGetters);

        commit({
            type: PlotSelectionsMutations.updatePlotSelection,
            payload: updatePayload
        });
    }
}

// For the comparison plot we want some special override behaviour
// If the user sets an indicator, we want to update the x-axis plot control based on this
// Handle any special plot overrides here. If there are some common patterns emerging, consider turning
// this into some plot control effect.
export const handlePlotControlOverrides = (selections: PlotSelectionsState[PlotName],
                                           plot: PlotName,
                                           selection: PlotSettingSelection,
                                           metadata: PlotMetadataFrame) => {
    if (plot === "comparison" && selection.plotSetting.id === "indicator_control") {
        const indicatorToDefaultXAxis: Dict<string> = {
            prevalence: "age",
            art_coverage: "age",
            art_current: "area",
            anc_prevalence_age_matched: "area",
            anc_art_coverage_age_matched: "area",
        };
        const setXAxisTo = indicatorToDefaultXAxis[selection.plotSetting.options[0].id];
        if (setXAxisTo) {
            const xAxisControl = selections.controls.find(p => p.id === "x_axis");
            const xAxisMetadata = metadata.plotSettingsControl.comparison.plotSettings.find(p => p.id === "x_axis");
            if (xAxisControl && xAxisMetadata) {
                const xAxisSelection = xAxisMetadata.options.find(o => o.id === setXAxisTo)
                xAxisControl.selection = [{
                    id: xAxisSelection!.id,
                    label: xAxisSelection!.label
                }];
            }
        }
    }
}
