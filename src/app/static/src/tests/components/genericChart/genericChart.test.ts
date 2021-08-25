import Vuex from 'vuex';
import {emptyState} from "../../../app/root";
import {shallowMount} from "@vue/test-utils";
import GenericChart from "../../../app/components/genericChart/GenericChart.vue";
import DataSource from "../../../app/components/genericChart/dataSelectors/DataSource.vue";
import {mockGenericChartState} from "../../mocks";
import {GenericChartState} from "../../../app/store/genericChart/genericChart";
import ErrorAlert from "../../../app/components/ErrorAlert.vue";

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
            }
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
        return shallowMount(GenericChart,{store, propsData});
    };

    it("renders as expected", () => {
        const wrapper = getWrapper();
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
                dataset1: [{value: "test"}],
                dataset3: [{value: "test"}]
            }
        };
        getWrapper(mockGetDataset, state);
        expect(mockGetDataset.mock.calls.length).toBe(1);
        expect(mockGetDataset.mock.calls[0][1]).toStrictEqual({datasetId: "dataset2", url: "/dataset2"});
    });

    it("does not fetch default dataset on data source value change if it already exists in state", () => {
        const mockGetDataset = jest.fn();
        const state = {
            datasets: {
                dataset2: [{value: "test"}]
            }
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
