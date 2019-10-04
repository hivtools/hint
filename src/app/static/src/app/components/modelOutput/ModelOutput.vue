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
    import {mapActions, mapState} from "vuex";
    import FileUpload from "../FileUpload.vue";
    import Choropleth from "../plots/Choropleth.vue";
    import ChoroplethFilters from "../ChoroplethFilters.vue";
    import {PartialFileUploadProps} from "../../types";
    import {RootState} from "../../root";
    import {DataType} from "../../store/filteredData/filteredData";

    const namespace: string = 'filteredData';


    export default Vue.extend({
        name: "ModelOutput",
        created() {
            this.selectDataType(DataType.Output)
        },
        methods: {
            ...mapActions({
                selectDataType: 'filteredData/selectDataType'
            })
        },
        components: {
            Choropleth,
            ChoroplethFilters
        }
    })
</script>