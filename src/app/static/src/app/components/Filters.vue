<template>
    <div v-if="hasSelectedDataType" >
        <label :for="sex-filters">Sex</label>
        <treeselect id="sex-filters" :multiple="true"
                    :options="sexFilters.available"
                    :value="sexFilters.selected"
                    @input="updateSexFilter"></treeselect>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapActions, mapState} from "vuex";
    import {DataType, FilterType, FilteredDataState} from "../store/filteredData/filteredData";
    import Treeselect from '@riophae/vue-treeselect';

    const namespace: string = 'filteredData';

    const treeselectOptions = (stringOptions: string[]) : TreeselectOption[] => {
        return stringOptions.map(x => { return {"id": x, "label": x}  });
    };

    interface TreeselectOption {
        id: string,
        label: string
    }

    export interface FilterOptions {
        available: TreeselectOption[],
        selected: string[]
    }

    export default Vue.extend ({
        name: "Filters",
        computed: mapState<FilteredDataState>(namespace, {

            hasSelectedDataType: state => state.selectedDataType != null,

            sexFilters: (state) => ({
                available: treeselectOptions(state.selectedDataType == DataType.ANC ?
                    ["female"] :
                    ["female", "male", "both"]),
                selected: state.selectedFilters.sex
            } as FilterOptions)
        }),
        methods: {
            ...mapActions({
                filterUpdated: 'filteredData/filterUpdated',
            }),
            updateSexFilter(value: string[]){
                this.filterUpdated([FilterType.Sex, value]);
            },
        },
        components: { Treeselect }
    });
</script>

<style scoped>

</style>