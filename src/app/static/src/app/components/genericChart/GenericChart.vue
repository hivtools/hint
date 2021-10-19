<template>
    <div>
        <div class="row" v-if="chartData">
            <div class="col-3">
                <div v-for="ds in chartConfigValues.dataSourceConfigValues" :key="ds.config.id">
                    <data-source v-if="ds.editable && availableDatasetIds.length > 1"
                                 :config="ds.config"
                                 :datasets="chartMetadata.datasets"
                                 :value="ds.selections.datasetId"
                                 @update="updateDataSource(ds.config.id, $event)">
                    </data-source>
                    <filters v-if="ds.config.showFilters && ds.filters && ds.selections.selectedFilterOptions"
                                :filters="ds.filters"
                                :selected-filter-options="ds.selections.selectedFilterOptions"
                                @update="updateSelectedFilterOptions(ds.config.id, $event)">
                    </filters>
                </div>
            </div>
            <div class="col-9">
                <div class="chart-container" :style="{height: chartHeight}">
                    <plotly class="chart"
                            v-if="!this.chartDataIsEmpty"
                           :chart-metadata="chartConfigValues.chartConfig"
                           :chart-data="chartData"
                           :layout-data="chartConfigValues.layoutData"
                           :style="{height: chartConfigValues.scrollHeight}"></plotly>
                    <div v-else class="mt-5" id="empty-generic-chart-data">
                        <div class="empty-chart-message px-3 py-2">
                            <span class="lead">
                                <strong v-translate="'noChartData'"></strong>
                            </span>
                         </div>
                     </div>
                </div>
                <div v-for="dataSource in chartConfigValues.dataSourceConfigValues.filter(ds => ds.tableConfig)"
                     :key="dataSource.config.id">
                    <generic-chart-table :table-config="dataSource.tableConfig"
                                         :filtered-data="chartData[dataSource.config.id]"
                                         :columns="dataSource.columns"
                                         :selected-filter-options="dataSource.selections.selectedFilterOptions"
                    ></generic-chart-table>
                </div>
            </div>
        </div>
        <div class="row" v-if="!chartData">
            <div class="text-center col-12">
                <loading-spinner size="lg"></loading-spinner>
                <h2 id="loading-message" v-translate="'loadingData'"></h2>
            </div>
        </div>
        <div v-if="error" class="row">
            <error-alert :error="error"></error-alert>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {
        DataSourceConfig,
        Dict, DisplayFilter, GenericChartColumn,
        GenericChartDataset,
        GenericChartMetadata,
        GenericChartMetadataResponse, GenericChartTableConfig
    } from "../../types";
    import DataSource from "./dataSelectors/DataSource.vue";
    import Filters from "../plots/Filters.vue";
    import ErrorAlert from "../ErrorAlert.vue";
    import LoadingSpinner from "../LoadingSpinner.vue";
    import {mapActionByName, mapStateProp} from "../../utils";
    import {genericChart, GenericChartState} from "../../store/genericChart/genericChart";
    import {getDatasetPayload} from "../../store/genericChart/actions";
    import {FilterOption} from "../../generated";
    import Plotly from "./Plotly.vue";
    import {filterData, genericChartColumnsToFilters} from "./utils";
    import GenericChartTable from "./GenericChartTable.vue";

    interface DataSourceConfigValues {
        selections: DataSourceSelections
        editable: boolean
        config: DataSourceConfig
        filters: DisplayFilter[] | null
        columns: GenericChartColumn[] | null
        tableConfig: GenericChartTableConfig | undefined
    }

    interface ChartConfigValues {
        dataSourceConfigValues: DataSourceConfigValues[]
        layoutData: Dict<unknown>
        scrollHeight: string
        chartConfig: string
    }

    interface DataSourceSelections {
        datasetId: string,
        selectedFilterOptions: Dict<FilterOption[]> | null
    }

    interface Data {
        dataSourceSelections:  Dict<DataSourceSelections>
    }

    interface Props {
        metadata: GenericChartMetadataResponse
        chartId: string
        chartHeight: string
        availableDatasetIds: string[]
    }

    interface Computed {
        datasets: Record<string, GenericChartDataset>
        error: Error | null
        chartMetadata: GenericChartMetadata
        chartConfigValues: ChartConfigValues
        chartData: Dict<unknown[]> | null
        chartDataIsEmpty: boolean
        filters: Dict<DisplayFilter[]>
    }

    interface Methods {
        ensureDataset: (datasetId: string) => void,
        getDataset: (payload: getDatasetPayload) => void,
        setDataSourceDefaultFilterSelections: (dataSourceId: string, datasetId: string) => void,
        updateDataSource: (dataSourceId: string, datasetId: string) => void,
        updateSelectedFilterOptions: (dataSourceId: string, options: Dict<FilterOption[]> | null) => void
    }

    const namespace = "genericChart";

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "GenericChart",
        props: {
            metadata: Object,
            chartId: String,
            chartHeight: String,
            availableDatasetIds: Array
        },
        components: {
            DataSource,
            Filters,
            Plotly,
            GenericChartTable,
            ErrorAlert,
            LoadingSpinner
        },
        data: function() {
            const chart = this.metadata[this.chartId];
            const dataSourceSelections = chart.dataSelectors.dataSources
                .reduce((running: Record<string, DataSourceSelections>, dataSource: DataSourceConfig) => ({
                    ...running,
                    [dataSource.id]: {
                        datasetId: this.availableDatasetIds.find(id => id === dataSource.datasetId) || this.availableDatasetIds[0],
                        selectedFilterOptions: null
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
            filters() {
                // Convert 'columns' in the metadata section of all fetched datasets into filters which we can pass
                // to the Filters components. Build a dictionary keyed by dataset id, of related DisplayFilter[].
                const result = {} as Dict<DisplayFilter[]>;
                for (const datasetConfig of this.chartMetadata.datasets) {
                    const datasetId = datasetConfig.id;
                    if (!this.datasets[datasetId]) {
                        continue;
                    }

                    let filterColumns: GenericChartColumn[] = [];
                    if (datasetConfig.filters) {
                        // Only include columns which are configured as filters in the dataset config
                        const configuredFilterIds = datasetConfig.filters.map(filter => filter.id);
                        const allColumns = this.datasets[datasetId]?.metadata.columns || [];
                        filterColumns = allColumns.filter(column => configuredFilterIds.includes(column.id));
                    }
                    result[datasetId] = genericChartColumnsToFilters(filterColumns, datasetConfig.filters);
                }
                return result;
            },
            chartConfigValues() {
                const dataSourceConfigValues = this.chartMetadata.dataSelectors.dataSources.map((dataSourceConfig) => {
                    const selections = this.dataSourceSelections[dataSourceConfig.id];
                    return {
                        selections,
                        editable: dataSourceConfig.type === "editable",
                        config: dataSourceConfig,
                        columns: this.datasets[selections.datasetId]?.metadata.columns,
                        filters: this.filters[selections.datasetId],
                        tableConfig: this.chartMetadata.datasets.find(d => d.id === selections.datasetId)?.table
                    }
                });

                //Provide additional metadata to jsonata relating to subplots (rows and columns)
                //and define scroll height
                const layoutData = {} as Dict<unknown>;
                let scrollHeight = "100%";
                const subplots = this.chartMetadata.subplots;
                if (subplots && this.chartData) {
                    const distinctAreas = new Set(this.chartData["data"].map((row: any) => row[subplots.distinctColumn]));
                    const numberOfPlots = distinctAreas.size;
                    const rows = Math.ceil(numberOfPlots / subplots.columns);
                    layoutData.subplots = {
                        ...subplots,
                        rows
                    };
                    //Height per row plus enough to accommodate margin and padding
                    scrollHeight = `${(subplots.heightPerRow * rows) + 70}px`;
                }

                // The metadata supports multiple chart types per chart e.g Scatter and Bar, but for now we only need to
                // support one chart type, so here we select the first config in the array
                const chartConfig = this.chartMetadata.chartConfig[0].config;

                return {
                    dataSourceConfigValues,
                    layoutData,
                    scrollHeight,
                    chartConfig
                };
            },
            chartData() {
                const result = {} as Dict<unknown[]>;

                for (const dataSource of this.chartMetadata.dataSelectors.dataSources) {
                    const dataSourceId = dataSource.id;
                    const dataSourceSelections = this.dataSourceSelections[dataSourceId];
                    const datasetId = dataSourceSelections.datasetId;
                    const unfilteredData = this.datasets[datasetId]?.data;

                    const filters = this.filters[datasetId] || [];
                    const selectedFilterOptions = dataSourceSelections.selectedFilterOptions;

                    if (!unfilteredData || !selectedFilterOptions) {
                        return null; //Do not attempt to initialise if we are missing any datasets, or selections not initialised
                    }

                    result[dataSourceId] = filterData(unfilteredData, filters, selectedFilterOptions);
                }
                return result;
            },
            chartDataIsEmpty() {
                return !this.chartData ||
                    Object.keys(this.chartData).every(dataSourceId => this.chartData![dataSourceId].length === 0);

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
                //clear current datasource filter selections while we fetch & show spinner
                this.updateSelectedFilterOptions(dataSourceId, null);
                await this.ensureDataset(datasetId);
                this.setDataSourceDefaultFilterSelections(dataSourceId, datasetId);
            },
            setDataSourceDefaultFilterSelections(dataSourceId: string, datasetId: string) {
                const selectedFilterOptions = this.datasets[datasetId].metadata.defaults.selected_filter_options;
                if (selectedFilterOptions) {
                    this.dataSourceSelections[dataSourceId] = {
                        datasetId,
                        selectedFilterOptions
                    };
                }
            },
            updateSelectedFilterOptions(dataSourceId: string, options: Dict<FilterOption[]> | null) {
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
