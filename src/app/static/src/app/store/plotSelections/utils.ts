import { Commit } from "vuex";
import { CalibrateMetadataResponse, FilterOption, FilterTypes } from "../../generated";
import { PlotName } from "./plotSelections";
import { PlotSelectionUpdate, PlotSelectionsMutations } from "./mutations";
import { RootState } from "../../root";

export const filtersAfterUseShapeRegions = (filterTypes: FilterTypes[], rootState: RootState) => {
    const filters = [...filterTypes];
    const area = filters.find(f => f.id == "area");
    if (area && area.use_shape_regions) {
        const regions: FilterOption[] = rootState.baseline.shape!.filters!.regions ?
            [rootState.baseline.shape!.filters!.regions] : [];

        const index = filters.findIndex(f => f.id === "area");
        const { use_shape_regions, ...areaFilterConfig } = area;
        filters[index] = { ...areaFilterConfig, options: regions };
    }
    return filters;
};

export const commitPlotDefaultSelections = (metadata: CalibrateMetadataResponse, commit: Commit, rootState: RootState) => {
    const plotControl = metadata.plotSettingsControl;
    const filters = filtersAfterUseShapeRegions(metadata.filterTypes, rootState);
    for (const plotName in plotControl) {
        const name = plotName as PlotName;
        const selectionsInState: PlotSelectionUpdate = {
            plot: name,
            selections: {
                controls: {},
                filterSelections: {}
            }
        };
        const control = plotControl[plotName as PlotName];
        let filterTypes = control.defaultFilterTypes;
        let multiFitlers: string[] = [];
        let filterValues: Record<string, string[]> = {}

        // add default control options to state object and get filters
        control.plotSettings.forEach(setting => {
            const defaultOption = setting.options[0];
            if (setting.id !== "default") {
                selectionsInState.selections.controls[setting.id] = [{ id: defaultOption.id, label: defaultOption.label }];
            }

            // resolve effects
            const effect = defaultOption.effect;
            if (effect.setFilters) {
                filterTypes = effect.setFilters;
            }
            if (effect.setMultiple) {
                // remove dupes just in case
                multiFitlers = [...new Set([...multiFitlers, ...effect.setMultiple])];
            }
            if (effect.setFilterValues) {
                filterValues = {...filterValues, ...effect.setFilterValues};
            }
        });

        // we can now combine all the data to get filterSelections
        filterTypes!.forEach(f => {
            const filter = filters.find(filterType => filterType.id === f.filterId)!;
            
            // TODO need to consider nested children
            if (multiFitlers.includes(f.stateFilterId)) {
                selectionsInState.selections.filterSelections[f.stateFilterId] = filter.options;
            } else {
                selectionsInState.selections.filterSelections[f.stateFilterId] = [filter.options[0]];
            }

            if (f.stateFilterId in filterValues) {
                const optionIds = filterValues[f.stateFilterId];
                const filterOptions = [];
                for (let i = 0; i < filter.options.length; i++) {
                    if (optionIds.includes(filter.options[i].id)) {
                        filterOptions.push(filter.options[i]);
                    }
                    if (filterOptions.length === optionIds.length) {
                        break;
                    }
                }
                selectionsInState.selections.filterSelections[f.stateFilterId] = filterOptions;
            }
        });

        commit(
            `plotSelections/${PlotSelectionsMutations.updatePlotSelection}`,
            { payload: selectionsInState },
            { root: true }
        );
    }
};