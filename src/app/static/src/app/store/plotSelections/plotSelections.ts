import { CalibrateMetadataResponse, FilterOption } from "../../generated";
import { mutations } from "./mutations";

export type PlotName = keyof CalibrateMetadataResponse["plotSettingsControl"]
const plotNames: PlotName[] = ["barchart", "choropleth", "bubble", "table"]

type FilterConfigValue = {
    filterId: string
    label: string
    multiple: boolean
}

export type PlotSelectionsState = {
    [P in PlotName]: {
        controls: Record<string, FilterOption[]>
        filterSelections: Record<string, FilterOption[]>,
        filterConfig: Record<string, FilterConfigValue>
    }
}

export const initialPlotSelectionsState = (): PlotSelectionsState => {
    const emptySelections = {
        controls: {},
        filterSelections: {}
    };
    return Object.fromEntries(plotNames.map(plot => [plot, emptySelections])) as PlotSelectionsState;
}

export const plotSelections = {
    namespaced: true,
    state: initialPlotSelectionsState(),
    mutations
};