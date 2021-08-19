<template>
    <div>
        {{JSON.stringify(chartMetadata)}}
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {GenericChartMetadata, GenericChartMetadataResponse} from "../../types";

    interface Props {
        metadata: GenericChartMetadataResponse
        chartId: string
    }

    interface Computed {
        chartMetadata: GenericChartMetadata
    }

    export default Vue.extend<unknown, unknown, Computed, Props>({
        name: "GenericChart",
        props: {
            metadata: Object,
            chartId: String
        },
        computed: {
            chartMetadata() {
                return this.metadata[this.chartId]!;
            }
        }
    });
</script>

<style scoped>

</style>
