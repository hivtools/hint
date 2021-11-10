import registerTranslations from "../../../app/store/translations/registerTranslations";
import Vuex from 'vuex';
import {emptyState} from "../../../app/root";
import {shallowMount} from "@vue/test-utils";
import GenericChart from "../../../app/components/genericChart/GenericChart.vue";
import DataSource from "../../../app/components/genericChart/dataSelectors/DataSource.vue";
import Filters from "../../../app/components/plots/Filters.vue";
// Mock the import of plotly to avoid import failures in non-browser context
jest.mock("plotly.js-basic-dist", () => ({
    newPlot: jest.fn()
}));
import Plotly from "../../../app/components/genericChart/Plotly.vue";
import {mockGenericChartState, mockSuccess} from "../../mocks";
import {GenericChartState} from "../../../app/store/genericChart/genericChart";
import ErrorAlert from "../../../app/components/ErrorAlert.vue";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";
import {expectTranslated} from "../../testHelpers";
import {GenericChartMetadataResponse} from "../../../app/types";
import {actions} from "../../../app/store/genericChart/actions";
import {mutations} from "../../../app/store/genericChart/mutations";
import {mockAxios} from "../../mocks";
import GenericChartTable from "../../../app/components/genericChart/GenericChartTable.vue";

describe("GenericChart component", () => {

    const metadata: GenericChartMetadataResponse = {
        "test-chart": {
            datasets: [
                {
                    id: "dataset1",
                    label:"Dataset 1",
                    url: "/dataset1",
                    filters: [
                        {id: "age", source: "data", allowMultiple: false},
                        {id: "year", source: "data", allowMultiple: true}
                    ]
                },
                {
                    id: "dataset2",
                    label:"Dataset 2",
                    url: "/dataset2",
                    filters: [
                        {id: "year", source: "data", allowMultiple: false}
                    ]
                },
                {
                    id: "dataset3",
                    label:"Dataset 3",
                    url: "/dataset3",
                    filters: [
                        {id: "type", source: "data", allowMultiple: false}
                    ]
                }
            ],
            dataSelectors: {
                dataSources: [
                    {id: "visible1", type: "editable", label: "First", datasetId: "dataset1", showFilters: true, showIndicators: false},
                    {id: "visible2", type: "editable", label: "Second", datasetId: "dataset2", showFilters: false, showIndicators: false},
                    {id: "hidden", type: "fixed", datasetId: "dataset3", showFilters: true, showIndicators: false}
                ]
            },
            chartConfig: [{
                id: "scatter",
                label: "Scatter",
                config: "Test Chart Config"
            }]
        }
    };

    const datasets =  {
        dataset1: {
            data: [
                {age: "1", year: "2020", value: 1},
                {age: "1", year: "2021", value: 2},
                {age: "2", year: "2020", value: 3},
                {age: "2", year: "2021", value: 4}
            ],
            metadata: {
                columns: [
                    {
                        id: "age",
                        column_id: "age",
                        label: "Age",
                        values: [
                            {id: "1", label: "1"},
                            {id: "2", label: "2"}
                        ]
                    },
                    {
                        id: "year",
                        column_id: "year",
                        label: "Year",
                        values: [
                            {id: "2020", label: "2020"},
                            {id: "2021", label: "2021"}
                        ]
                    }
                ],
                defaults: {
                    selected_filter_options: {
                        age: [{id: "1", label: "1"}],
                        year: [{id: "2021", label: "2021"}]
                    }
                }
            }
        },
        dataset2: {
            data: [
                {age: "10", year: "2020", value: 10},
                {age: "10", year: "2021", value: 20},
                {age: "20", year: "2020", value: 30},
                {age: "20", year: "2021", value: 40}
            ],
            metadata: {
                columns: [
                    {
                        id: "age",
                        column_id: "age",
                        label: "Age",
                        options: [
                            {id: "10", label: "10"},
                            {id: "20", label: "20"}
                        ]
                    },
                    {
                        id: "year",
                        column_id: "year",
                        label: "Year",
                        options: [
                            {id: "2020", label: "2020"},
                            {id: "2021", label: "2021"}
                        ]
                    }
                ],
                defaults: {
                    selected_filter_options: {
                        age: [{id: "10", label: "10"}],
                        year: [{id: "2020", label: "2020"}]
                    }
                }
            }
        },
        dataset3: {
            data: [{type: "test", value: "test"}],
            metadata: {
                columns: [
                    {
                        id: "type",
                        column_id: "type",
                        label: "Type",
                        values: [{id: "test", label: "test"}]
                    }
                ],
                defaults: {
                    selected_filter_options: {
                        type: [{id: "test", label: "test"}]
                    }
                }
            }
        }
    } as any;

    beforeEach(() => {
        mockAxios.reset();
    });

    const data = {
        chartId: "test-chart",
        availableDatasetIds: ["dataset1", "dataset2", "dataset3"]
    };

    const getWrapper = (state: Partial<GenericChartState> = {}, metadataProp: GenericChartMetadataResponse = metadata, ChartPropsData = data) => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                genericChart: {
                    namespaced: true,
                    state: mockGenericChartState(state),
                    actions, // Use real actions and mutations so state is updated with fetched datasets, to avoid errors
                    mutations
                }
            }
        });

        const propsData = {
            ...ChartPropsData,
            metadata: metadataProp
        };
        registerTranslations(store);
        return shallowMount(GenericChart,{store, propsData});
    };

    it("renders as expected without chart data", (done) => {
        mockAxios.onGet(`/dataset1`)
            .reply(200, mockSuccess({metadata: {defaults: {}}}));
        mockAxios.onGet(`/dataset2`)
            .reply(200, mockSuccess({metadata: {defaults: {}}}));
        mockAxios.onGet(`/dataset3`)
            .reply(200, mockSuccess({metadata: {defaults: {}}}));

        const wrapper = getWrapper();
        setTimeout(() => {
            expect(wrapper.findAll(DataSource).length).toBe(0);
            expect(wrapper.findAll(Filters).length).toBe(0);
            expect(wrapper.find(Plotly).exists()).toBe(false);
            expect(wrapper.find(LoadingSpinner).attributes("size")).toBe("lg");
            expectTranslated(wrapper.find("h2"), "Loading your data", "Chargement de vos données",
                "A carregar os seus dados", wrapper.vm.$store);
            done();
        });
    });

    it("renders as expected with chart data", (done) => {
        const state = {datasets};
        const wrapper = getWrapper(state);

        setTimeout(() => {
            const dataSources = wrapper.findAll(DataSource);
            expect(dataSources.length).toBe(2); //It should not show non-editable data sources

            expect(dataSources.at(0).props("config")).toStrictEqual(
                {
                    id: "visible1",
                    type: "editable",
                    label: "First",
                    datasetId: "dataset1",
                    showFilters: true,
                    showIndicators: false
                }
            );
            expect(dataSources.at(0).props("datasets")).toBe(metadata["test-chart"].datasets);
            expect(dataSources.at(0).props("value")).toBe("dataset1");

            expect(dataSources.at(1).props("config")).toStrictEqual(
                {
                    id: "visible2",
                    type: "editable",
                    label: "Second",
                    datasetId: "dataset2",
                    showFilters: false,
                    showIndicators: false
                }
            );
            expect(dataSources.at(1).props("datasets")).toBe(metadata["test-chart"].datasets);
            expect(dataSources.at(1).props("value")).toBe("dataset2");

            const filters = wrapper.findAll(Filters);
            expect(filters.length).toBe(2);
            expect(filters.at(0).props("filters")).toStrictEqual([
                {
                    id: "age",
                    column_id: "age",
                    label: "Age",
                    allowMultiple: false,
                    options: [
                        {id: "1", label: "1"},
                        {id: "2", label: "2"}
                    ]
                },
                {
                    id: "year",
                    column_id: "year",
                    label: "Year",
                    allowMultiple: true,
                    options: [
                        {id: "2020", label: "2020"},
                        {id: "2021", label: "2021"}
                    ]
                }
            ],);
            expect(filters.at(0).props("selectedFilterOptions")).toStrictEqual(datasets.dataset1.metadata.defaults.selected_filter_options);
            expect(filters.at(1).props("filters")).toStrictEqual( [
                {
                    id: "type",
                    column_id: "type",
                    label: "Type",
                    allowMultiple: false,
                    options: [{id: "test", label: "test"}]
                }
            ]);
            expect(filters.at(1).props("selectedFilterOptions")).toStrictEqual(datasets.dataset3.metadata.defaults.selected_filter_options);

            const plotly = wrapper.find(Plotly);
            expect(plotly.props("chartMetadata")).toBe("Test Chart Config");
            expect(plotly.props("chartData")).toStrictEqual({
                visible1: [{age: "1", year: "2021", value: 2}],
                visible2: [
                    {age: "10", year: "2020", value: 10},
                    {age: "20", year: "2020", value: 30}
                ],
                hidden: [{type: "test", value: "test"}]
            });
            expect(plotly.props("layoutData")).toStrictEqual({});
            expect(plotly.element.style.height).toBe("100%");

            expect(wrapper.find(ErrorAlert).exists()).toBe(false);
            expect(wrapper.find("#empty-generic-chart-data").exists()).toBe(false);
            done();
        });
    });

    it("renders as expected with empty chart data", (done) => {
        const datasetsWithNoMatchingData = {
            dataset1: {
                metadata: datasets.dataset1.metadata,
                data: [
                    {age: "1", year: "1920", value: 1},
                    {age: "1", year: "1921", value: 2},
                    {age: "2", year: "1920", value: 3},
                    {age: "2", year: "1921", value: 4}
                ]
            },
            dataset2: {
                metadata: datasets.dataset2.metadata,
                data: [
                    {age: "10", year: "1020", value: 10},
                    {age: "10", year: "1921", value: 20},
                    {age: "20", year: "1920", value: 30},
                    {age: "20", year: "1921", value: 40}
                ]
            },
            dataset3: {
                metadata: datasets.dataset3.metadata,
                data: []
            }
        };
        const state = {datasets: datasetsWithNoMatchingData};
        const wrapper = getWrapper(state);
        setTimeout(() => {
            expect(wrapper.find(Plotly).exists()).toBe(false);
            const noDataDiv = wrapper.find("#empty-generic-chart-data");
            expectTranslated(noDataDiv,
                "No data are available for the selected combination. Please review the combination of filter values selected.",
               "Aucune donnée n'est disponible pour la combinaison sélectionnée. Veuillez examiner la combinaison de valeurs de filtre sélectionnée.",
                "Não existem dados disponíveis para a combinação selecionada. Por favor, reveja a combinação dos valores de filtro selecionados.",
                wrapper.vm.$store
            );

            expect(wrapper.findAll(DataSource).length).toBe(2);
            const filters = wrapper.findAll(Filters);
            expect(filters.length).toBe(2);
            expect(filters.at(0).props("filters")).toStrictEqual([
                {
                    id: "age",
                    column_id: "age",
                    label: "Age",
                    allowMultiple: false,
                    options: [
                        {id: "1", label: "1"},
                        {id: "2", label: "2"}
                    ]
                },
                {
                    id: "year",
                    column_id: "year",
                    label: "Year",
                    allowMultiple: true,
                    options: [
                        {id: "2020", label: "2020"},
                        {id: "2021", label: "2021"}
                    ]
                }
            ],);
            expect(filters.at(0).props("selectedFilterOptions")).toStrictEqual(datasets.dataset1.metadata.defaults.selected_filter_options);
            expect(filters.at(1).props("filters")).toStrictEqual( [
                {
                    id: "type",
                    column_id: "type",
                    label: "Type",
                    allowMultiple: false,
                    options: [{id: "test", label: "test"}]
                }
            ]);
            expect(filters.at(1).props("selectedFilterOptions")).toStrictEqual(datasets.dataset3.metadata.defaults.selected_filter_options);

            done();
        });
    });

    it("does not render DataSource component when available datasetIds length is not greater than 1", () => {
        const state = {datasets};
        const reducedMetadata = {
            "test-chart": {
                datasets: metadata["test-chart"].datasets,
                dataSelectors: {
                    dataSources: [
                        {
                            id: "visible1",
                            type: "editable",
                            label: "First",
                            datasetId: "dataset1",
                            showFilters: true,
                            showIndicators: false
                        },
                        {id: "hidden", type: "fixed", datasetId: "dataset2", showFilters: true, showIndicators: false}
                    ]
                },
                chartConfig: metadata["test-chart"].chartConfig
            }
        } as any;

        const propsData = {
            chartId: "test-chart",
            availableDatasetIds: ["dataset1"]
        };

        const wrapper = getWrapper(state, reducedMetadata, propsData);
        const dataSources = wrapper.findAll(DataSource);
        expect(dataSources.exists()).toBe(false);
    });

    it("sets data source's datasetId if default is not available, and hides datasource picker if only one available dataset", () => {
        const state = {datasets};
        const reducedMetadata =  {
            "test-chart": {
                datasets: [metadata["test-chart"].datasets[0]],
                dataSelectors: {
                    dataSources: [
                        {id: "visible1", type: "editable", label: "First", datasetId: "dataset1", showFilters: true, showIndicators: false},
                        {id: "hidden", type: "fixed", datasetId: "dataset2", showFilters: true, showIndicators: false}
                    ]
                },
                chartConfig: metadata["test-chart"].chartConfig
            }
        } as any;

        const propsData = {
            chartId: "test-chart",
            availableDatasetIds: ["dataset2"]
        };

        const wrapper = getWrapper(state, reducedMetadata, propsData);
        const dataSources = wrapper.findAll(DataSource);
        expect(dataSources.exists()).toBe(false);
        const vm = wrapper.vm as any
        expect(vm.dataSourceSelections.visible1.datasetId).toEqual("dataset2")
        expect(vm.dataSourceSelections.hidden.datasetId).toEqual("dataset2")
    });

    it("updates filter selections and chart data on filters update", (done) => {
        const state = {datasets};
        const wrapper = getWrapper(state);

        setTimeout(() => {
            const dataset1Filters = wrapper.findAll(Filters).at(0);
            const newFilterSelections = {
                age: [{id: "2", label: "2"}],
                year: [{id: "2020", label: "2020"}]
            };
            dataset1Filters.vm.$emit("update", newFilterSelections);

            setTimeout(() => {
                expect(dataset1Filters.props("selectedFilterOptions")).toStrictEqual(newFilterSelections);
                const chartData = wrapper.find(Plotly).props("chartData");
                expect(chartData).toStrictEqual({
                    visible1: [{age: "2", year: "2020", value: 3}],
                    visible2: [
                        {age: "10", year: "2020", value: 10},
                        {age: "20", year: "2020", value: 30}
                    ],
                    hidden: [{type: "test", value: "test"}]
                });
                done();
            });
        });
    });

    it("sets plotly layoutData and height based on subplot config", (done) => {
        const subplotsMetadata: GenericChartMetadataResponse = {
            "test-chart": {
                datasets: [
                    {id: "dataset1", label:"Dataset 1", url: "/dataset1"}
                ],
                dataSelectors: {
                    dataSources: [
                        {id: "data", type: "editable", label: "First", datasetId: "dataset1", showFilters: true, showIndicators: false},
                    ]
                },
                subplots: {
                    columns: 2,
                    distinctColumn: "area",
                    heightPerRow: 100
                },
                chartConfig: [{
                    id: "scatter",
                    config: "Test Chart Config"
                }]
            }
        } as any;
        const subplotDatasets = {
            dataset1: {
                data: [
                    {type: "test", area:"a", value: 1},
                    {type: "test", area:"b",value: 2},
                    {type: "test", area:"c",value: 3},
                    {type: "test", area:"d",value: 4},
                    {type: "test", area:"e",value: 5}
                ],
                metadata: {
                    columns: [
                        {
                            id: "type",
                            column_id: "type",
                            label: "Type",
                            allowMultiple: false,
                            options: [
                                {id: "test", label: "test"},
                                {id: "other", label: "other"}
                            ]
                        }
                    ],
                    defaults: {
                        selected_filter_options: {
                            type: [{id: "test", label: "test"}]
                        }
                    }
                }
            }
        } as any;
        const state = {datasets: subplotDatasets};

        const wrapper = getWrapper(state, subplotsMetadata);
        setTimeout(() => {
            const dataSources = wrapper.findAll(DataSource);
            expect(dataSources.length).toBe(1);
            const filters = wrapper.findAll(Filters);
            expect(filters.length).toBe(1);

            const plotly = wrapper.find(Plotly);
            // 5 values of distinctColumn, so should be 3 rows of 2 columns
            expect(plotly.props("layoutData")).toStrictEqual({
                subplots: {
                    columns: 2,
                    distinctColumn: "area",
                    heightPerRow: 100,
                    rows: 3
                }
            });
            expect(plotly.element.style.height).toBe("370px");
            done();
        });
    });

    it("fetches default datasets, and sets default selections, on mount", (done) => {
        mockAxios.onGet(`/dataset1`)
            .reply(200, mockSuccess(datasets.dataset1));
        mockAxios.onGet(`/dataset2`)
            .reply(200, mockSuccess(datasets.dataset2));
        mockAxios.onGet(`/dataset3`)
            .reply(200, mockSuccess(datasets.dataset3));

        const wrapper = getWrapper();
        setTimeout(() => {
            expect(mockAxios.history.get.length).toBe(3);
            expect(mockAxios.history.get[0].url).toBe("/dataset1");
            expect(mockAxios.history.get[1].url).toBe("/dataset2");
            expect(mockAxios.history.get[2].url).toBe("/dataset3");

            expect(wrapper.vm.$data.dataSourceSelections).toStrictEqual({
                visible1: {
                    datasetId: "dataset1",
                    selectedFilterOptions: {
                        age: [{id: "1", label: "1"}],
                        year: [{id: "2021", label: "2021"}]
                    }
                },
                visible2: {
                    datasetId: "dataset2",
                    selectedFilterOptions: {
                        age: [{id: "10", label: "10"}],
                        year: [{id: "2020", label: "2020"}]
                    }
                },
                hidden: {
                    datasetId: "dataset3",
                    selectedFilterOptions: {
                        type: [{id: "test", label: "test"}]
                    }
                }
            });

            done();
        });
    });

    it("fetches dataset on data source value change, and sets default selections, if dataset does not exist in state", (done) => {
        const datasets1And3 = {
            dataset1: datasets.dataset1,
            dataset3: datasets.dataset3
        };
        const reducedMetadata =  {
            "test-chart": {
                datasets: metadata["test-chart"].datasets,
                dataSelectors: {
                    dataSources: [
                        {id: "visible1", type: "editable", label: "First", datasetId: "dataset1", showFilters: true, showIndicators: false},
                        {id: "hidden", type: "fixed", datasetId: "dataset3", showFilters: true, showIndicators: false}
                    ]
                },
                chartConfig: metadata["test-chart"].chartConfig
            }
        } as any;

        mockAxios.onGet(`/dataset2`)
            .reply(200, mockSuccess(datasets.dataset2));

        const wrapper = getWrapper({datasets: datasets1And3}, reducedMetadata);
        setTimeout(async () => {
            await wrapper.findAll(DataSource).at(0).vm.$emit("update", "dataset2");

            // expect filter selections to have been set to null while ensure dataset
            expect(wrapper.vm.$data.dataSourceSelections.visible1.selectedFilterOptions).toBe(null);
            setTimeout(() => {
                expect(mockAxios.history.get.length).toBe(1);
                expect(mockAxios.history.get[0].url).toBe("/dataset2");
                expect(wrapper.vm.$data.dataSourceSelections).toStrictEqual({
                    visible1: {
                        datasetId: "dataset2",
                        selectedFilterOptions: {
                            age: [{id: "10", label: "10"}],
                            year: [{id: "2020", label: "2020"}]
                        }
                    },
                    hidden: {
                        datasetId: "dataset3",
                        selectedFilterOptions: {
                            type: [{id: "test", label: "test"}]
                        }
                    }
                });
                done();
            });
        });
    });

    it("does not fetch default dataset on mount if it already exists in state", () => {
        const state = {datasets};
        getWrapper(state);
        setTimeout(() => {
            expect(mockAxios.history.get.length).toBe(0);
        });
    });

    it("does not fetch default dataset on data source value change if it already exists in state", (done) => {
        const state = {datasets};
        const wrapper = getWrapper(state);
        setTimeout(() => {
            wrapper.findAll(DataSource).at(0).vm.$emit("update", "dataset2");
            setTimeout(() => {
                expect(mockAxios.history.get.length).toBe(0);
                done();
            });
        });
    });

    it("renders error", () => {
        const genericChartError = {error: "TEST-ERROR"} as any;
        const wrapper = getWrapper( {datasets, genericChartError});
        expect(wrapper.find(ErrorAlert).props("error")).toBe(genericChartError);
    });

    it("does not render table if no table config for data source's dataset", () => {
        const state = {datasets};
        const wrapper = getWrapper(state);

        setTimeout(() => {
            expect(wrapper.findAll(GenericChartTable).length).toBe(0);
        });
    });

    it("renders table if table config exists for data source's dataset", (done) => {
        const tableConfig1 = {
            columns: [
                {
                    data: {columnId: "age", labelFilterId: null},
                    header: {type: "filterLabel", filterId: "age"}
                }
            ]
        };
        const tableConfig2 = {
            columns: [
                {
                    data: {columnId: "year", labelFilterId: "year"},
                    header: {type: "filterLabel", filterId: "year"}
                }
            ]
        };

        const customMetadata = {
            "test-chart": {
                ...metadata["test-chart"],
                datasets: [
                    {...metadata["test-chart"].datasets[0], table: tableConfig1},
                    {...metadata["test-chart"].datasets[1], table: tableConfig2},
                    metadata["test-chart"].datasets[2]
                ] as any
            }
        };
        const state = {datasets};
        const wrapper = getWrapper(state, customMetadata);

        setTimeout(() => {
            const tables = wrapper.findAll(GenericChartTable);
            expect(tables.length).toBe(2);
            expect(tables.at(0).props("tableConfig")).toBe(tableConfig1);
            expect(tables.at(0).props("filteredData")).toStrictEqual([{age: "1", year: "2021", value: 2}]);
            expect(tables.at(0).props("columns")).toBe(datasets.dataset1.metadata.columns);
            expect(tables.at(0).props("selectedFilterOptions")).toStrictEqual(datasets.dataset1.metadata.defaults.selected_filter_options);

            expect(tables.at(1).props("tableConfig")).toBe(tableConfig2);
            expect(tables.at(1).props("filteredData")).toStrictEqual([
                {age: "10", year: "2020", value: 10},
                {age: "20", year: "2020", value: 30}
            ]);
            expect(tables.at(1).props("columns")).toBe(datasets.dataset2.metadata.columns);
            expect(tables.at(1).props("selectedFilterOptions")).toStrictEqual(datasets.dataset2.metadata.defaults.selected_filter_options);

            done();
        });
    });
});
