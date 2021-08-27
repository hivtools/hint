<template>
    <div class="row">
        <div class="col-3">
            <div v-for="ds in chartConfigValues.dataSourceConfigValues" :key="ds.config.id">
                <data-source v-if="ds.editable"
                             :config="ds.config"
                             :datasets="chartMetadata.datasets"
                             :value="ds.selections.datasetId"
                             @update="updateDataSource(ds.config.id, $event)">
                </data-source>
            </div>
        </div>
        <div class="col-9">
            {{ chartId }} coming soon
            <error-alert v-if="error" :error="error"></error-alert>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {
        DataSourceConfig,
        GenericChartDataset,
        GenericChartMetadata,
        GenericChartMetadataResponse
    } from "../../types";
    import DataSource from "./dataSelectors/DataSource.vue";
    import ErrorAlert from "../ErrorAlert.vue";
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
        datasets: Record<string, GenericChartDataset>
        error: Error | null
        chartMetadata: GenericChartMetadata
        chartConfigValues: ChartConfigValues
    }

    interface Methods {
        ensureDataset: (datasetId: string) => void,
        getDataset: (payload: getDatasetPayload) => void,
        updateDataSource: (dataSourceId: string, datasetId: string) => void
    }

    const namespace = "genericChart";

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "GenericChart",
        props: {
            metadata: Object,
            chartId: String
        },
        components: {
            DataSource,
            ErrorAlert
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
            datasets:  mapStateProp<GenericChartState, Record<string, GenericChartDataset>>(namespace,
                (state: GenericChartState) => state.datasets),
            error: mapStateProp<GenericChartState, Error | null>(namespace,
                (state: GenericChartState) => state.genericChartError),
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
                if (datasetId && !this.datasets[datasetId]) {
                    const dataset = this.chartMetadata.datasets.find(dataset => dataset.id === datasetId)!;
                    this.getDataset({datasetId, url: dataset.url});
                }
            },
            updateDataSource(dataSourceId: string, datasetId: string) {
                this.dataSourceSelections[dataSourceId]!.datasetId = datasetId;
                this.ensureDataset(datasetId);
            }
        },
        mounted() {
            this.chartConfigValues.dataSourceConfigValues.forEach((dataSourceValues) => {
                this.ensureDataset(dataSourceValues.selections.datasetId);
            });
        }
    });
</script>
