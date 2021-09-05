// Mock the import of plotly to avoid import failures in non-browser context
import {FilterOption} from "../../../app/generated";

jest.mock("plotly.js", () => ({
    react: jest.fn()
}));
import registerTranslations from "../../../app/store/translations/registerTranslations";
import Vuex from 'vuex';
import {emptyState} from "../../../app/root";
import {shallowMount} from "@vue/test-utils";
import GenericChart from "../../../app/components/genericChart/GenericChart.vue";
import DataSource from "../../../app/components/genericChart/dataSelectors/DataSource.vue";
import Filters from "../../../app/components/plots/Filters.vue";
import Plotly from "../../../app/components/genericChart/Plotly.vue";
import {mockGenericChartState} from "../../mocks";
import {GenericChartState} from "../../../app/store/genericChart/genericChart";
import ErrorAlert from "../../../app/components/ErrorAlert.vue";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";
import {expectTranslated} from "../../testHelpers";

describe("GenericChart component", () => {

    const metadata = {
        "test-chart": {
            datasets: [
                {id: "dataset1", label:"Dataset 1", url: "/dataset1"},
                {id: "dataset2", label:"Dataset 2", url: "/dataset2"},
                {id: "dataset3", label:"Dataset 3", url: "/dataset3"}
            ],
            dataSelectors: {
                dataSources: [
                    {id: "visible1", type: "editable", label: "First", datasetId: "dataset1"},
                    {id: "visible2", type: "editable", label: "Second", datasetId: "dataset2"},
                    {id: "hidden", type: "readonly", datasetId: "dataset3"}
                ]
            },
            chartConfig: [
                "Test Chart Config"
            ]
        }
    };

    const getWrapper = (getDataset = jest.fn(), state: Partial<GenericChartState> = {}) => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                genericChart: {
                    namespaced: true,
                    state: mockGenericChartState(state),
                    actions: {
                        getDataset
                    }
                }
            }
        });
        const propsData = {
            metadata,
            chartId: "test-chart"
        };
        registerTranslations(store);
        return shallowMount(GenericChart,{store, propsData});
    };

    it("renders as expected without chart data", () => {
        const wrapper = getWrapper();
        expect(wrapper.findAll(DataSource).length).toBe(0);
        expect(wrapper.findAll(Filters).length).toBe(0);
        expect(wrapper.find(Plotly).exists()).toBe(false);
        expect(wrapper.find(LoadingSpinner).attributes("size")).toBe("lg");
        expectTranslated(wrapper.find("h2"), "Loading your data", "Chargement de vos données",
            "A carregar os seus dados", wrapper.vm.$store);
    });

    it("renders as expected with chart data", () => {
        const state = {
            datasets: {
                dataset1: {
                    data: [
                        {age: "1", year: "2020", value: 1},
                        {age: "1", year: "2021", value: 2},
                        {age: "2", year: "2020", value: 3},
                        {age: "2", year: "2021", value: 4}
                    ],
                    metadata: {
                        filters: [
                            {
                                id: "age",
                                column_id: "age",
                                label: "Age",
                                allowMultipe: false,
                                options: [
                                    {id: "1", label: "1"},
                                    {id: "2", label: "2"}
                                ]
                            },
                            {
                                id: "year",
                                column_id: "year",
                                label: "Year",
                                allowMultipe: false,
                                options: [
                                    {id: "2020", label: "2020"},
                                    {id: "2021", label: "2021"}
                                ]
                            }
                        ],
                        defaults: {
                            selected_filter_options: {
                                age: [{id: "1", label: "1"}],
                                year: [{id: "2", label: "2"}]
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
                        filters: [
                            {
                                id: "age",
                                column_id: "age",
                                label: "Age",
                                allowMultipe: false,
                                options: [
                                    {id: "10", label: "10"},
                                    {id: "20", label: "20"}
                                ]
                            },
                            {
                                id: "year",
                                column_id: "year",
                                label: "Year",
                                allowMultipe: false,
                                options: [
                                    {id: "2020", label: "2020"},
                                    {id: "2021", label: "2021"}
                                ]
                            }
                        ],
                        defaults: {
                            selected_filter_options: {
                                age: [{id: "1", label: "1"}],
                                year: [{id: "2", label: "2"}]
                            }
                        }
                    }
                },
                dataset3: {
                    data: [{type: "test", value: "test"}],
                    metadata: {
                        filters: [
                            {
                                id: "type",
                                column_id: "type",
                                label: "Type",
                                allowMultiple: false,
                                options: [{id: "test", value: "test"}]
                            }
                        ],
                        defaults: {
                            selected_filter_options: {
                                type: [{id: "test", value: "test"}]
                            }
                        }
                    }
                }
            } as any
        };
        const wrapper = getWrapper(jest.fn(), state);
        wrapper.setData({
            dataSourceSelections: {
                visible1: {
                    selectedFilterOptions: {
                        age: [{id: "1", label: "1"}],
                        year: [{id: "2020", label: "2020"}]
                    }
                },
                visible2: {
                    selectedFilterOptions: {
                        age: [{id: "10", label: "10"}],
                        year: [{id: "2020", label: "2020"}]
                    }
                },
                hidden: {
                    selectedFilterOptions: {
                        type: [{id: "test", label: "test"}]
                    }
                }
            }
        });

        const dataSources = wrapper.findAll(DataSource);
        expect(dataSources.length).toBe(2); //It should not show non-editable data sources

        expect(dataSources.at(0).props("config")).toStrictEqual(
            {id: "visible1", type: "editable", label: "First", datasetId: "dataset1"}
            );
        expect(dataSources.at(0).props("datasets")).toBe(metadata["test-chart"].datasets);
        expect(dataSources.at(0).props("value")).toBe("dataset1");

        expect(dataSources.at(1).props("config")).toStrictEqual(
            {id: "visible2", type: "editable", label: "Second", datasetId: "dataset2"}
        );
        expect(dataSources.at(1).props("datasets")).toBe(metadata["test-chart"].datasets);
        expect(dataSources.at(1).props("value")).toBe("dataset2");

        expect(wrapper.find(ErrorAlert).exists()).toBe(false);
    });

    it("fetches default datasets on mount", () => {
        const mockGetDataset = jest.fn();
        getWrapper(mockGetDataset);
        expect(mockGetDataset.mock.calls.length).toBe(3);
        expect(mockGetDataset.mock.calls[0][1]).toStrictEqual({datasetId: "dataset1", url: "/dataset1"});
        expect(mockGetDataset.mock.calls[1][1]).toStrictEqual({datasetId: "dataset2", url: "/dataset2"});
        expect(mockGetDataset.mock.calls[2][1]).toStrictEqual({datasetId: "dataset3", url: "/dataset3"});
    });

    it("fetches dataset on data source value change", () => {
        const mockGetDataset = jest.fn();
        const wrapper = getWrapper(mockGetDataset);
        mockGetDataset.mockClear();

        wrapper.findAll(DataSource).at(0).vm.$emit("update", "dataset2");
        expect(mockGetDataset.mock.calls.length).toBe(1);
        expect(mockGetDataset.mock.calls[0][1]).toStrictEqual({datasetId: "dataset2", url: "/dataset2"});
    });

    it("does not fetch default dataset on mount if it already exists in state", () => {
        const mockGetDataset = jest.fn();
        const state = {
            datasets: {
                dataset1: {data: [{value: "test"}], metadata: null},
                dataset3: {data: [{value: "test"}], metadata: null}
            } as any
        };
        getWrapper(mockGetDataset, state);
        expect(mockGetDataset.mock.calls.length).toBe(1);
        expect(mockGetDataset.mock.calls[0][1]).toStrictEqual({datasetId: "dataset2", url: "/dataset2"});
    });

    it("does not fetch default dataset on data source value change if it already exists in state", () => {
        const mockGetDataset = jest.fn();
        const state = {
            datasets: {
                dataset2: {data: [{value: "test"}], metadata: null}
            } as any
        };
        const wrapper = getWrapper(mockGetDataset, state);
        mockGetDataset.mockClear();

        wrapper.findAll(DataSource).at(0).vm.$emit("update", "dataset2");
        expect(mockGetDataset.mock.calls.length).toBe(0);
    });

    it("renders error", () => {
        const genericChartError = {error: "TEST-ERROR"} as any;
        const wrapper = getWrapper(jest.fn(), {genericChartError});
        expect(wrapper.find(ErrorAlert).props("error")).toBe(genericChartError);
    });
});
