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
    tableMetadata: (state: ModelCalibrateState, getters: any, rootState: RootState) =>
        (plotName: PlotName, selectedPresetId: FilterOption["id"]): TableMetadata | undefined => {
            const tableMetadata: PlotMetadataFrame = getMetadataFromPlotName(rootState, plotName);
            const currentPreset = tableMetadata.plotSettingsControl[plotName].plotSettings
                .find(s => s.id === "presets")?.options
                .find(o => o.id === selectedPresetId);
            return currentPreset?.effect.customPlotEffect;
        }
};
