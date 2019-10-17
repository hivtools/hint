<template>
    <div class="row">
        <div class="col-md-3">
            <choropleth-filters></choropleth-filters>
        </div>
        <div class="col-md-9">
            <choropleth></choropleth>
        </div>
    </div>
</template>

<script lang="ts">

    import Vue from "vue";
    import {mapActions} from "vuex";
    import Choropleth from "../plots/Choropleth.vue";
    import ChoroplethFilters from "../plots/ChoroplethFilters.vue";
    import {DataType} from "../../store/filteredData/filteredData";

    const namespace: string = 'filteredData';


    export default Vue.extend({
        name: "ModelOutput",
        created() {
            this.selectDataType(DataType.Output)
        },
        methods: {
            ...mapActions(namespace, ["selectDataType"])
        },
        components: {
            Choropleth,
            ChoroplethFilters
        }
    })
</script>