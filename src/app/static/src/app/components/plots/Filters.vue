<template>
    <div>
        <h4 v-translate="'filters'"></h4>
        <div :id="'filter-' + filter.id" v-for="filter in filters" :key="filter.id" class="form-group">
            <filter-select :value="getSelectedFilterValues(filter.id)"
                           :multiple="filter.allowMultiple"
                           :label="filter.label"
                           :options="filter.options"
                           :disabled="filter.options.length===0"
                           @select="onFilterSelect(filter, $event)"></filter-select>
        </div>
    </div>
</template>

<script lang="ts">
    import { defineComponentVue2WithProps } from "../../defineComponentVue2/defineComponentVue2";
    import FilterSelect from "./FilterSelect.vue";
    import {Dict, DisplayFilter} from "../../types";
    import {FilterOption} from "../../generated";

    interface Props {
        filters: DisplayFilter[],
        selectedFilterOptions: Dict<FilterOption[]>,
    }

    interface Methods {
        getSelectedFilterValues: (filterId: string) => string[],
        onFilterSelect: (filter: DisplayFilter, selectedOptions: FilterOption[]) => void
    }

    export default defineComponentVue2WithProps<unknown, Methods, unknown, Props>({
        name: "Filters",
        components: {FilterSelect},
        props: {
            filters: {
                type: Array,
                required: true
            },
            selectedFilterOptions: {
                type: Object,
                required: true
            }
        },
        methods: {
            getSelectedFilterValues(filterId: string) {
                return (this.selectedFilterOptions[filterId] || []).map(o => o.id);
            },
            onFilterSelect(filter: DisplayFilter, selectedOptions: FilterOption[]) {
                const newSelectedFilterOptions = {...this.selectedFilterOptions};
                newSelectedFilterOptions[filter.id] = selectedOptions;

                this.$emit("update", newSelectedFilterOptions);
            },
        }
    });
</script>