<template>
    <div>
        {{selectedDataTypeString}}
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapActions, mapState} from "vuex";
    import {DataType, FilteredDataState} from "../store/filteredData/filteredData";

    const namespace: string = 'filteredData';

    export default Vue.extend ({
        name: "Filters",
        computed: mapState<FilteredDataState>(namespace, {

            selectedDataType: state => state.selectedDataType,
            selectedDataTypeString: state => state.selectedDataType ? DataType[state.selectedDataType] : "none"
        })
    });
</script>

<style scoped>

</style>