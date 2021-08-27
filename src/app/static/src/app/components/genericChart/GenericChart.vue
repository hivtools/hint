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
                <filters v-if="ds.config.showFilters"
                            :filters="ds.filters"
                            :selected-filter-options="ds.selections.selectedFilterOptions"
                            @update="updateSelectedFilterOptions(ds.config.id, $event)">
                </filters>
            </div>
        </div>
        <div class="col-9">
            {{JSON.stringify(datasets)}}
            <error-alert v-if="error" :error="error"></error-alert>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {
        DataSourceConfig,
        Dict, DisplayFilter,
        GenericChartDataset,
        GenericChartMetadata,
        GenericChartMetadataResponse
    } from "../../types";
    import DataSource from "./dataSelectors/DataSource.vue";
    import Filters from "../plots/Filters.vue";
    import ErrorAlert from "../ErrorAlert.vue";
    import {mapActionByName, mapStateProp} from "../../utils";
    import {GenericChartState} from "../../store/genericChart/genericChart";
    import {getDatasetPayload} from "../../store/genericChart/actions";
    import {FilterOption} from "../../generated";

    interface DataSourceConfigValues {
        selections: DataSourceSelections,
        editable: boolean,
        config: DataSourceConfig
        filters: DisplayFilter[]
    }

    interface ChartConfigValues {
        dataSourceConfigValues: DataSourceConfigValues[]
    }

    interface DataSourceSelections {
        datasetId: string,
        selectedFilterOptions: Dict<FilterOption[]>
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
        setDataSourceDefaultFilterSelections: (dataSourceId: string, datasetId: string) => void,
        updateDataSource: (dataSourceId: string, datasetId: string) => void,
        updateSelectedFilterOptions: (dataSourceId: string, options: Dict<FilterOption[]>) => void
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
            Filters,
            ErrorAlert
        },
        data: function() {
            const chart = this.metadata[this.chartId];
            const dataSourceSelections = chart.dataSelectors.dataSources
                .reduce((running: Record<string, DataSourceSelections>, dataSource: DataSourceConfig) => ({
                    ...running,
                    [dataSource.id]: {
                        datasetId: dataSource.datasetId,
                        selectedFilterOptions: {}
                    }
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
                    const selections = this.dataSourceSelections[dataSourceConfig.id];
                    console.log("selections dataset id: " + selections.datasetId)
                    console.log("metadata:" + this.datasets[selections.datasetId]?.metadata)
                    return {
                        selections,
                        editable: dataSourceConfig.type === "editable",
                        config: dataSourceConfig,
                        filters: this.datasets[selections.datasetId]?.metadata.filters
                    }
                });
                return {
                    dataSourceConfigValues
                };
            }
        },
        methods: {
            getDataset: mapActionByName(namespace, 'getDataset'),
            async ensureDataset(datasetId: string) {
                if (datasetId && !this.datasets[datasetId]) {
                    const datasetConfig = this.chartMetadata.datasets.find(dataset => dataset.id === datasetId)!;
                    await this.getDataset({datasetId, url: datasetConfig.url});
                }
            },
            async updateDataSource(dataSourceId: string, datasetId: string) {
                this.dataSourceSelections[dataSourceId]!.datasetId = datasetId;
                await this.ensureDataset(datasetId);
                this.setDataSourceDefaultFilterSelections(dataSourceId, datasetId);
            },
            setDataSourceDefaultFilterSelections(dataSourceId: string, datasetId: string) {
                const selectedFilterOptions = this.datasets[datasetId].metadata.defaults.selected_filter_options;
                this.updateSelectedFilterOptions(dataSourceId, {...selectedFilterOptions});
            },
            updateSelectedFilterOptions(dataSourceId: string, options: Dict<FilterOption[]>) {
                this.dataSourceSelections[dataSourceId].selectedFilterOptions = options;
            }
        },
        async mounted() {
            for (const dataSourceValues of this.chartConfigValues.dataSourceConfigValues) {
                await this.ensureDataset(dataSourceValues.selections.datasetId);
                this.setDataSourceDefaultFilterSelections(dataSourceValues.config.id, dataSourceValues.selections.datasetId);
            }
        }
    });
</script>
