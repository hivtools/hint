<template>
    <div class="row">
        <div class="col-3">
            <div v-for="ds in chartConfigValues.dataSourceValues" :key="ds.config.id">
                <data-source v-if="ds.editable"
                             :config="ds.config"
                             :datasets="chartMetadata.datasets"
                             :value="ds.selections.datasetId"
                             @update="updateDataSource(chartIndex, ds.dataSourceId, $event)" />
                </data-source>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {DataSourceConfig, Dict, GenericChartMetadata, GenericChartMetadataResponse} from "../../types";
    import DataSource from "./dataSelectors/DataSource.vue";
    import {mapActionByName, mapStateProp} from "../../utils";
    import {GenericChartState} from "../../store/genericChart/genericChart";
    import {getDatasetPayload} from "../../store/genericChart/actions";

    interface DataSourceConfigValues {
        selections: DataSourceSelections,
        editable: boolean,
        config: DataSourceConfig
    }

    interface ChartConfigValues {
        dataSourceConfigValues: DataSourceConfigValues[]
    }

    interface DataSourceSelections {
        datasetId: string
    }

    interface Data {
        dataSourceSelections:  Record<string, DataSourceSelections>
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
        ensureDataset: (datasetId: string) => void,
        getDataset: (payload: getDatasetPayload) => void
    }

    const namespace = "genericChart";

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "GenericChart",
        props: {
            metadata: Object,
            chartId: String
        },
        components: {
            DataSource
        },
        data: function() {
            const chart = this.metadata[this.chartId];
            const dataSourceSelections = chart.dataSelectors.dataSources
                .reduce((running: Record<string, DataSourceSelections>, dataSource: DataSourceConfig) => ({
                    ...running,
                    [dataSource.id]: {datasetId: dataSource.datasetId}
                }), {});

            return {
                dataSourceSelections
            }
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
                        selections: this.dataSourceSelections[dataSourceConfig.id],
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
            ensureDataset(datasetId: string) {
                const dataset = this.chartMetadata.datasets.find(dataset => dataset.id === datasetId)!;
                console.log("ensureing dataset with url "+ dataset.url)
                if (datasetId && !this.datasets[datasetId]) {
                    this.getDataset({datasetId, url: dataset.url});
                }
            }
        },
        mounted() {
            this.chartConfigValues.dataSourceConfigValues.forEach((dataSourceValues) => {
                this.ensureDataset(dataSourceValues.selections.datasetId);
            });
        }
    });
</script>
