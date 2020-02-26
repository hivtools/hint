<template>
    <div>
        <h4 v-translate="'filters'"></h4>
        <div :id="'filter-' + filter.id" v-for="filter in filters" class="form-group">
            <filter-select :value="getSelectedFilterValues(filter.id)"
                           :multiple="filterIsMultiple(filter.id)"
                           :label="filter.label"
                           :options="filter.options"
                           :disabled="filter.options.length==0"
                           @select="onFilterSelect(filter, $event)"></filter-select>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import FilterSelect from "./FilterSelect.vue";
    import {Dict, Filter} from "../../types";
    import {FilterOption} from "../../generated";

    interface Props {
        filters: Filter[],
        selectedFilterOptions: Dict<FilterOption[]>,
        selectMultipleFilterIds: string[]
    }

    interface Methods {
        filterIsMultiple: (filterId: string) => Boolean,
        getSelectedFilterValues: (filterId: string) => string[],
        onFilterSelect: (filter: Filter, selectedOptions: FilterOption[]) => void
    }

    const props = {
        filters: {
            type: Array
        },
        selectedFilterOptions: {
            type: Object
        },
        selectMultipleFilterIds: {
            type: Array
        }
    };

    export default Vue.extend<{}, Methods, {}, Props>({
        name: "Filters",
        components: {FilterSelect},
        props: props,
        methods: {
            filterIsMultiple(filterId: string) {
                return this.selectMultipleFilterIds && this.selectMultipleFilterIds.indexOf(filterId) > -1;
            },
            getSelectedFilterValues(filterId: string) {
                return (this.selectedFilterOptions[filterId] || []).map(o => o.id);
            },
            onFilterSelect(filter: Filter, selectedOptions: FilterOption[]) {
                const newSelectedFilterOptions = {...this.selectedFilterOptions};
                newSelectedFilterOptions[filter.id] = selectedOptions;

                this.$emit("update", newSelectedFilterOptions);
            },
        }
    });
</script>