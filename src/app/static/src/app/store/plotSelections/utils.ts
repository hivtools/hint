import { Commit } from "vuex";
import { CalibrateMetadataResponse, FilterOption, FilterRef, FilterTypes, PlotSettingOption } from "../../generated";
import { PlotName } from "./plotSelections";
import { PlotSelectionUpdate, PlotSelectionsMutations } from "./mutations";
import { RootState } from "../../root";

export const filtersAfterUseShapeRegions = (filterTypes: FilterTypes[], rootState: RootState) => {
    return filterTypes.map(filter => filterAfterUseShapeRegions(filter, rootState));
};

export const filterAfterUseShapeRegions = (filterType: FilterTypes, rootState: RootState) => {
    if (filterType.use_shape_regions) {
        const regions: FilterOption[] = rootState.baseline.shape!.filters!.regions ?
            [rootState.baseline.shape!.filters!.regions] : [];

        const { use_shape_regions: _, ...areaFilterConfig } = filterType;
        filterType = { ...areaFilterConfig, options: regions };
    }
    return filterType;
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

export const filtersInfoFromPlotSettings = (
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

    const filters: PlotSelectionUpdate["selections"]["filters"] = filterRefs!.map(f => {
        const filter = filterTypes.find(filterType => filterType.id === f.filterId)!;
        const isMultiple = multiFilters.includes(f.stateFilterId);
        let selection: FilterOption[];

        if (f.stateFilterId in filterValues) {
            // we have specified fixed values
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
            selection = filterOptions;
        } else {
            selection = isMultiple ?
                getFullNestedFilters(filter.options) :
                [filter.options[0]];
        }
        return {
            ...f,
            multiple: isMultiple,
            selection
        }
    });
    return filters;
}

export const commitPlotDefaultSelections = (
    metadata: CalibrateMetadataResponse,
    commit: Commit,
    rootState: RootState
) => {
    const plotControl = metadata.plotSettingsControl;
    const filters = filtersAfterUseShapeRegions(metadata.filterTypes, rootState);
    for (const plotName in plotControl) {
        const name = plotName as PlotName;
        const payload: PlotSelectionUpdate = {
            plot: name,
            selections: { controls: [], filters: [] }
        };
        const control = plotControl[name];
        const defaultSettingOptions: PlotSettingOption[] = [];
        control.plotSettings.forEach(setting => {
            const defaultOption = setting.options[0];
            defaultSettingOptions.push(defaultOption);
            if (setting.id !== "default") {
                payload.selections.controls.push({
                    id: setting.id,
                    label: setting.label,
                    selection: [{ id: defaultOption.id, label: defaultOption.label }]
                });
            }
        });

        const filtersInfo = filtersInfoFromPlotSettings(
            defaultSettingOptions,
            control.defaultFilterTypes,
            filters
        );

        payload.selections.filters = filtersInfo;

        commit(
            `plotSelections/${PlotSelectionsMutations.updatePlotSelection}`,
            { payload }, { root: true }
        );
    }
};
