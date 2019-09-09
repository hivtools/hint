<template>
    <div v-if="hasSelectedDataType">
        <div class="container-fluid">
            <div class="row">
                <div class="col">
                    <label>Sex</label>
                    <treeselect id="sex-filters" :multiple="true"
                                :options="sexFilters.available"
                                :value="sexFilters.selected"
                                v-on:select="sexFilterSelected"
                                v-on:deselect="sexFilterDeselected"></treeselect>
                </div>
                <div class="col">
                    <label>Age</label>
                    <treeselect id="age-filters" :multiple="true"
                                :options="ageFilters.available"
                                :value="ageFilters.selected"
                                v-on:select="ageFilterSelected"
                                v-on:deselect="ageFilterDeselected"></treeselect>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapActions, mapState} from "vuex";
    import {DataType, FilterType, FilteredDataState} from "../store/filteredData/filteredData";
    import Treeselect from '@riophae/vue-treeselect';

    const namespace: string = 'filteredData';

    const treeselectOptions = (stringOptions: string[]) : TreeselectOption[] => {
        return (stringOptions ? stringOptions : []).map(x => { return {"id": x, "label": x}  });
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
            selectedDataFilterOptions: function() {
                return this.$store.getters['filteredData/selectedDataFilterOptions']
            },

            sexFilters: (state) => ({
                available: treeselectOptions(state.selectedDataType == DataType.ANC ?
                    ["female"] :
                    ["female", "male", "both"]),
                selected: state.selectedFilters.sex
            } as FilterOptions),

            ageFilters: function(state) {
                return {
                    available: treeselectOptions(this.selectedDataFilterOptions.age as string[]),
                    selected: state.selectedFilters.age
                } as FilterOptions;
            }
        }),
        methods: {
            ...mapActions({
                filterAdded: 'filteredData/filterAdded',
                filterRemoved: 'filteredData/filterRemoved'
            }),
            sexFilterSelected(value: TreeselectOption){
                this.filterAdded([FilterType.Sex, value.id]);
            },
            sexFilterDeselected(value: TreeselectOption){
                this.filterRemoved([FilterType.Sex, value.id]);
            },
            ageFilterSelected(value: TreeselectOption){
                this.filterAdded([FilterType.Age, value.id]);
            },
            ageFilterDeselected(value: TreeselectOption){
                this.filterRemoved([FilterType.Age, value.id]);
            }
        },
        components: { Treeselect }
    });
</script>

<style scoped>

</style>