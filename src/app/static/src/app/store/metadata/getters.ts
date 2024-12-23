import {MetadataState} from "./metadata";

export const getters = {
    timeSeriesPlotTypeLabel: (state: MetadataState): Map<string, string> | undefined => {
        return new Map(state.reviewInputMetadata?.filterTypes
            .filter(f => f.id === "time_series_programme_plot_type" || f.id == "time_series_anc_plot_type")
            .flatMap(f => f.options)
            .map(({ id, label }) => [id, label]))
    },
};
