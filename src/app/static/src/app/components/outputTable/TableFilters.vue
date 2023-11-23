<template>
    <div class="form-group">
        <h4 v-translate="'presets'"></h4>
        <single-select :options="presetOptions"
                       :model-value="tableSelections.preset"
                       @update:model-value="changePresetSelection"/>
    </div>
    <new-filters :filters="filters"
                 :selectedFilterOptions="tableSelections.selectedFilterOptions"
                 @update:filters="changeTableSelections"></new-filters>
</template>

<script lang="ts">
import { useStore } from "vuex";
import { computed, defineComponent, onMounted } from "vue";
import { RootState } from "../../root";
import { Dict, DisplayFilter } from "../../types";
import { PlottingSelectionsMutations } from "../../store/plottingSelections/mutations";
import { TableSelections } from "../../store/plottingSelections/plottingSelections";
import { CalibrateMetadataResponse, FilterOption } from "../../generated";
import NewFilters from "./NewFilters.vue";
import { SingleSelect } from "@reside-ic/vue-nested-multiselect";

export default defineComponent({
    components: {
        NewFilters,
        SingleSelect
    },
    setup() {
        const store = useStore<RootState>();
        const tableSelections = computed(() => store.state.plottingSelections.table);
        const presets = computed(() => store.state.modelCalibrate.metadata?.tableMetadata.presets);
        const filters = computed<DisplayFilter[]>(() => store.getters["modelOutput/tableFilters"] || []);

        const presetOptions = computed(() => {
            return presets.value!.map(p => {
                return {id: p.defaults.id, label: p.defaults.label}
            });
        });

        const changeTableSelections = (event: any) => {
            store.commit(
                `plottingSelections/${PlottingSelectionsMutations.updateTableSelections}`,
                {payload: {selectedFilterOptions: event}}
            );
        };

        const toFilterOption = (filterId: string, optionId: string) => {
            const filter = filters.value.find(f => f.id === filterId);
            return filter?.options.find(option => option.id === optionId);
        };

        const getDefaultSelections = (preset: CalibrateMetadataResponse["tableMetadata"]["presets"][number]) => {
            const defaultSels = Object.fromEntries(filters.value.map(f => {
                if (f.id === preset.defaults.column || f.id === preset.defaults.row) {
                    return [f.id, f.options]
                }
                return [f.id, [f.options[0]]]
            }));
            return defaultSels
        };

        const changePresetSelection = (event: any) => {
            const currentPreset = presets.value?.find(p => p.defaults.id === event.id);
            if (!currentPreset) {
                return
            }

            store.commit(
                `plottingSelections/${PlottingSelectionsMutations.updateTableSelections}`,
                { payload: { preset: event.id } }
            );

            const payload = {
                selectedFilterOptions: getDefaultSelections(currentPreset)
            } as TableSelections;

            if (currentPreset?.defaults.selected_filter_options) {
                const selectedFilterOptions = currentPreset.defaults.selected_filter_options;
                const presetFilterSelection = {} as Dict<FilterOption[]>
                for (const presetFilter in selectedFilterOptions) {
                    const options = selectedFilterOptions[presetFilter];
                    const filterOptions = options.map(option => toFilterOption(presetFilter, option));
                    const cleanFilterOptions = filterOptions.filter(foption => foption !== undefined) as FilterOption[];
                    presetFilterSelection[presetFilter] = cleanFilterOptions;
                }
                const newPresetSelections = {
                    ...getDefaultSelections(currentPreset),
                    ...presetFilterSelection
                }
                payload.selectedFilterOptions = newPresetSelections;
            }

            store.commit(
                `plottingSelections/${PlottingSelectionsMutations.updateTableSelections}`,
                { payload }
            );
        };

        onMounted(() => {
            if (!tableSelections.value.preset) {
                changePresetSelection({ id: presets.value![0].defaults.id });
            }

            const existingFilterSels = tableSelections.value.selectedFilterOptions;
            const defaultSels = Object.fromEntries(filters.value.map(f => {
                if (f.allowMultiple) {
                    return [f.id, f.options]
                }
                return [f.id, [f.options[0]]]
            }));
            const newSelections = {
                ...defaultSels,
                ...existingFilterSels
            }
            changeTableSelections(newSelections)
        });

        return {
            filters,
            tableSelections,
            changeTableSelections,
            changePresetSelection,
            presetOptions
        }
    },
})

</script>