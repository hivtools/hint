<template>
    <div class="row">
        <div class="col-3">
            <div v-for="ds in chartConfigValues.dataSourceValues" :key="ds.config.id">
                {{ds.selectedDatasetId}}
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {DataSourceConfig, Dict, GenericChartMetadata, GenericChartMetadataResponse} from "../../types";
    import {api} from "../../apiService";
    import {mapActionByName, mapStateProp} from "../../utils";
    import {GenericChartState} from "../../store/genericChart/genericChart";
    import {getDatasetPayload} from "../../store/genericChart/actions";

    interface DataSourceConfigValues {
        selectedDatasetId: string,
        editable: boolean,
        config: DataSourceConfig
    }

    interface ChartConfigValues {
        dataSourceConfigValues: DataSourceConfigValues[]
    }

    interface Props {
        metadata: GenericChartMetadataResponse
        chartId: string
    }

    interface Computed {
        chartMetadata: GenericChartMetadata
        chartConfigValues: ChartConfigValues
        datasets: Record<string, Dict<unknown>[]>
    }

    interface Methods {
        ensureDataset: (datasetId: string, url: string) => void,
        getDataset: (payload: getDatasetPayload) => void
    }

    const namespace = "genericChart";

    export default Vue.extend<unknown, Methods, Computed, Props>({
        name: "GenericChart",
        props: {
            metadata: Object,
            chartId: String
        },
        computed: {
            datasets:  mapStateProp<GenericChartState, Record<string, Dict<unknown>[]>>(namespace,
                (state: GenericChartState) => state.datasets),
            chartMetadata() {
                return this.metadata[this.chartId]!;
            },
            chartConfigValues() {
                const dataSourceConfigValues = this.chartMetadata.dataSelectors.dataSources.map((dataSourceConfig) => {
                    return {
                        selectedDatasetId: dataSourceConfig.datasetId,
                        editable: dataSourceConfig.type === "editable",
                        config: dataSourceConfig
                    }
                });
                return {
                    dataSourceConfigValues
                };
            }
        },
        methods: {
            getDataset: mapActionByName(namespace, 'getDataset'),
            ensureDataset(datasetId: string, url: string) {
                if (datasetId && !this.datasets[datasetId]) {
                    this.getDataset({datasetId, url});
                }
            }
        },
        mounted() {
            this.chartConfigValues.dataSourceConfigValues.forEach((dataSourceValues) => {
                //TODO: find dataset config and get url from that
                this.ensureDataset(dataSourceValues.selectedDatasetId, dataSourceValues.config.url);
            });
        }
    });
</script>
