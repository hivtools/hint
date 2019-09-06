<template>
    <div>
        <div>
            <treeselect id="sex-filters" v-if="hasSelectedDataType" :multiple="true" :options="sexFilterOptions"
                        v-on:select="sexFilterSelected" v-on:deselect="sexFilterDeselected"></treeselect>
        </div>
        <div>
            <div>Testing...</div>
            <div v-for="filter in sexFilterData">{{filter}}</div>
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

    export default Vue.extend ({
        name: "Filters",
        computed: mapState<FilteredDataState>(namespace, {

            selectedDataType: state => state.selectedDataType,
            hasSelectedDataType: state => state.selectedDataType != null,

            sexFilterOptions: state => treeselectOptions(
                                            state.selectedDataType == DataType.ANC ?
                                            ["female"] :
                                            ["female", "male", "both"]
            ),
            sexFilterData: state => state.selectedFilters.sex
        }),
        methods: {
            ...mapActions({
                filterAdded: 'filteredData/filterAdded',
                filterRemoved: 'filteredData/filterRemoved'
            }),
            sexFilterSelected(value: treeselectOption){
                const option: string  = value.id;
                this.filterAdded([FilterType.Sex, option]);
            },
            sexFilterDeselected(value: treeselectOption){
                const option: string  = value.id;
                this.filterRemoved([FilterType.Sex, option]);
            }
        },
        components: { Treeselect }
    });
</script>

<style scoped>

</style>