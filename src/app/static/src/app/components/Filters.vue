<template>
    <div>
        <div>
            <treeselect id="sex-filters" v-if="hasSelectedDataType" :multiple="true" :options="sexFilterOptions"
                        v-on:select="sexFilterSelected" v-on:deselect="sexFilterDeselected"></treeselect>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapActions, mapState} from "vuex";
    import {DataType, FilteredDataState} from "../store/filteredData/filteredData";
    import Treeselect from '@riophae/vue-treeselect';

    const namespace: string = 'filteredData';

    const treeselectOptions = (stringOptions: string[]) => {
        return stringOptions.map(x => { return {"id": x, "label": x}  });
    };

    export default Vue.extend ({
        name: "Filters",
        computed: mapState<FilteredDataState>(namespace, {

            selectedDataType: state => state.selectedDataType,
            hasSelectedDataType: state => state.selectedDataType != null,

            sexFilterOptions: state => treeselectOptions(
                                            state.selectedDataType == DataType.ANC ?
                                            ["female"] :
                                            ["female", "male", "both"]
            )
        }),
        methods: {
            sexFilterSelected(value: object){
                //TODO: raise filterAdded action
                const option: string  = value.id;
            },
            sexFilterDeselected(value: object){
                //TODO: raise filterRemoved action
                const option: string  = value.id;
            }
        },
        components: { Treeselect }
    });
</script>

<style scoped>

</style>