<template>
    <div>
        <div v-if="hasSelectedDataType" >
            <treeselect id="sex-filters" :multiple="true"
                        :options="sexFilters.available"
                        :value="sexFilters.selected"
                        v-on:select="sexFilterSelected"
                        v-on:deselect="sexFilterDeselected"></treeselect>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapActions, mapState} from "vuex";
    import {DataType, FilterType, FilteredDataState} from "../store/filteredData/filteredData";
    import Treeselect from '@riophae/vue-treeselect';

    const namespace: string = 'filteredData';

    const treeselectOptions = (stringOptions: string[]) : treeselectOption[] => {
        return stringOptions.map(x => { return {"id": x, "label": x}  });
    };

    interface treeselectOption {
        id: string,
        label: string
    }

    interface filterOptions {
        available: treeselectOption[],
        selected: string[]
    }

    export default Vue.extend ({
        name: "Filters",
        computed: mapState<FilteredDataState>(namespace, {

            selectedDataType: state => state.selectedDataType,
            hasSelectedDataType: state => state.selectedDataType != null,

            sexFilters: (state) => ({
                available: treeselectOptions(state.selectedDataType == DataType.ANC ?
                    ["female"] :
                    ["female", "male", "both"]),
                 selected: state.selectedFilters.sex
            } as filterOptions)
        }),
        methods: {
            ...mapActions({
                filterAdded: 'filteredData/filterAdded',
                filterRemoved: 'filteredData/filterRemoved'
            }),
            sexFilterSelected(value: treeselectOption){
                this.filterAdded([FilterType.Sex, value.id]);
            },
            sexFilterDeselected(value: treeselectOption){
                this.filterRemoved([FilterType.Sex, value.id]);
            }
        },
        components: { Treeselect }
    });
</script>

<style scoped>

</style>