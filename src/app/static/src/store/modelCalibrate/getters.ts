import {ModelCalibrateState} from "./modelCalibrate";
import {getMetadataFromPlotName} from "../plotSelections/actions";
import {RootState} from "../../root";
import {PlotName} from "../plotSelections/plotSelections";
import {FilterOption, TableMetadata} from "../../generated";
import {PlotMetadataFrame} from "../metadata/metadata";

export const getters = {
    // For some filters we have an id in the filters which is different from that
    // in the data. e.g. for Area, filter id is "area" but in data this is "area_id"
    // This helper maps from the filter ID to the data ID.
    filterIdToColumnId: (state: ModelCalibrateState, getters: any, rootState: RootState) =>
        (plotName: PlotName, filterId: string) => {
            const metadata = getMetadataFromPlotName(rootState, plotName);
            return metadata.filterTypes.find(f => f.id === filterId)!.column_id;
    },
    tableMetadata: (state: ModelCalibrateState, getters: any, rootState: RootState, rootGetters: any) =>
        (plotName: PlotName): TableMetadata | undefined => {
            const metadata: PlotMetadataFrame = getMetadataFromPlotName(rootState, plotName);
            const selectedPreset: FilterOption = rootGetters["plotSelections/controlSelectionFromId"](plotName, "presets");
            let tableMetadata
            if (selectedPreset) {
                const currentPreset = metadata.plotSettingsControl[plotName].plotSettings
                    .find(s => s.id === "presets")?.options
                    .find(o => o.id === selectedPreset.id);
                tableMetadata = currentPreset?.effect.customPlotEffect
            }
            // Fallback to default if preset doesn't exist or has no value
            if (!tableMetadata) {
                tableMetadata = metadata.plotSettingsControl[plotName].defaultEffect?.customPlotEffect
            }
            return tableMetadata
        },
    cascadePlotIndicators: (state: ModelCalibrateState) => {
        // In the cascade plot, we want to show the bars in the specified order, as we want the bars to
        // actually "cascade". This is in contrast to normal plots in which we show the selected in order
        // that is in the drop down.
        return state.metadata?.plotSettingsControl.cascade.defaultEffect?.setFilterValues?.indicator
    }
};
