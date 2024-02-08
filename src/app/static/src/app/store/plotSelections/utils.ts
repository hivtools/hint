import { Commit } from "vuex";
import { CalibrateMetadataResponse, FilterOption, FilterRef, FilterTypes, PlotSettingOption } from "../../generated";
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

type NestedFilterOption = {
    id: string
    label: string,
    children?: NestedFilterOption[]
}

class Q {
    items: NestedFilterOption[]
    constructor() { this.items = [] }
    enqueue(item: NestedFilterOption) { this.items.push(item) }
    dequeue() { return this.items.pop()! }
    isEmpty() { return this.items.length === 0 }
}

const getFullNestedFilters = (filterOptions: NestedFilterOption[]) => {
    const fullFilterOptions: NestedFilterOption[] = [];
    const q = new Q();
    filterOptions.forEach(op => q.enqueue(op));
    while (!q.isEmpty()) {
        const currentOption = q.dequeue();
        fullFilterOptions.push(currentOption);
        if (currentOption.children && currentOption.children.length > 0) {
            currentOption.children.forEach(op => q.enqueue(op));
        }
    }
    return fullFilterOptions;
};

export const selectedFiltersFromPlotSettings = (
    settings: PlotSettingOption[],
    defaultFilterTypes: FilterRef[] | undefined,
    filterTypes: FilterTypes[]
) => {
    let filterRefs = defaultFilterTypes;
    let multiFilters: string[] = [];
    let filterValues: Record<string, string[]> = {};
    settings.forEach(setting => {
        // track which effects need to occur
        const effect = setting.effect;
        if (effect.setFilters) {
            filterRefs = effect.setFilters;
        }
        if (effect.setMultiple) {
            // remove dupes just in case
            multiFilters = [...new Set([...multiFilters, ...effect.setMultiple])];
        }
        if (effect.setFilterValues) {
            filterValues = {...filterValues, ...effect.setFilterValues};
        }
    });

    const filterSelections: PlotSelectionUpdate["selections"]["filterSelections"] = {};
    filterRefs!.forEach(f => {
        const filter = filterTypes.find(filterType => filterType.id === f.filterId)!;
        
        filterSelections[f.stateFilterId] = multiFilters.includes(f.stateFilterId) ?
                                            getFullNestedFilters(filter.options) :
                                            [filter.options[0]];

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
            filterSelections[f.stateFilterId] = filterOptions;
        }
    });
    return filterSelections;
}

export const commitPlotDefaultSelections = (metadata: CalibrateMetadataResponse, commit: Commit, rootState: RootState) => {
    const plotControl = metadata.plotSettingsControl;
    const filters = filtersAfterUseShapeRegions(metadata.filterTypes, rootState);
    for (const plotName in plotControl) {
        const name = plotName as PlotName;
        const selectionsInState: PlotSelectionUpdate = {
            plot: name,
            selections: { controls: {}, filterSelections: {} }
        };
        const control = plotControl[plotName as PlotName];
        const defaultSettingOptions: PlotSettingOption[] = [];
        control.plotSettings.forEach(setting => {
            const defaultOption = setting.options[0];
            defaultSettingOptions.push(defaultOption);
            if (setting.id !== "default") {
                selectionsInState.selections.controls[setting.id] = [{ id: defaultOption.id, label: defaultOption.label }];
            }
        });

        selectionsInState.selections.filterSelections = selectedFiltersFromPlotSettings(
            defaultSettingOptions,
            control.defaultFilterTypes,
            filters
        );

        commit(
            `plotSelections/${PlotSelectionsMutations.updatePlotSelection}`,
            { payload: selectionsInState },
            { root: true }
        );
    }
};