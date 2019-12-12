import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vuex from 'vuex';
import ModelOutput from "../../../app/components/modelOutput/ModelOutput.vue";
import {mockFilteredDataState, mockModelResultResponse, mockModelRunState,} from "../../mocks";
import {DataType} from "../../../app/store/filteredData/filteredData";
import {actions} from "../../../app/store/filteredData/actions";
import {mutations as filteredDataMutations} from "../../../app/store/filteredData/mutations";
import {mutations as modelOutputMutations} from "../../../app/store/modelOutput/mutations";
import {ModelOutputState} from "../../../app/store/modelOutput/modelOutput";
import {expectTranslatedText} from "../../testHelpers";

const localVue = createLocalVue();

function getStore(modelOutputState: Partial<ModelOutputState> = {}) {
    return new Vuex.Store({
        modules: {
            filteredData: {
                namespaced: true,
                state: mockFilteredDataState(),
                actions: actions,
                mutations: filteredDataMutations
            },
            modelRun: {
                namespaced: true,
                state: mockModelRunState({
                    result: mockModelResultResponse({data: ["TEST DATA"] as any})
                })
            },
            modelOutput: {
                namespaced: true,
                state: {
                    selectedTab: "",
                    ...modelOutputState,
                },
                getters: {
                    barchartIndicators: jest.fn(),
                    barchartFilters: jest.fn()
                },
                mutations: modelOutputMutations
            },
            plottingSelections: {
                namespaced: true,
                state: {
                    barchart: {
                        indicatorId: "TestIndicator",
                        xAxisId: "region",
                        disaggregateById: "age",
                        selectedFilterOptions: {
                            region: {id: "r1", label: "region 1"},
                            age: {id: "a1", label: "0-4"}
                        }
                    }
                }
            }
        }
    });
}

describe("ModelOutput component", () => {
    it("renders choropleth and choropleth filters", () => {
        const store = getStore();
        const wrapper = shallowMount(ModelOutput, {localVue, store});

        expect(wrapper.findAll("choropleth-filters-stub").length).toBe(1);
        expect(wrapper.findAll("choropleth-stub").length).toBe(1);
    });

    it("sets selectedDataType to Output", () => {
        const store = getStore();
        const wrapper = shallowMount(ModelOutput, {localVue, store});

        expect(store.state.filteredData.selectedDataType).toBe(DataType.Output);
    });

    it("if no selected tab in state, defaults to select Map tab", () => {
        const store = getStore();
        const wrapper = shallowMount(ModelOutput, {localVue, store});

        const activeTab = wrapper.find("a.active");
        expectTranslatedText(activeTab, "Map");
    });

    it("gets selected tab from state", () => {
        const store = getStore({selectedTab: "bar"});
        const wrapper = shallowMount(ModelOutput, {localVue, store});

        const activeTab = wrapper.find("a.active");
        expectTranslatedText(activeTab, "Bar");
    });

    it("can change tabs", () => {
        const store = getStore();
        const wrapper = shallowMount(ModelOutput, {store, localVue});

        expectTranslatedText(wrapper.find(".nav-link.active"), "Map");
        expect(wrapper.findAll("choropleth-filters-stub").length).toBe(1);
        expect(wrapper.findAll("choropleth-stub").length).toBe(1);
        expect(wrapper.find("#barchart-container").classes()).toEqual(["d-none"]);

        //should invoke mutation
        wrapper.findAll(".nav-link").at(1).trigger("click");

        expectTranslatedText(wrapper.find(".nav-link.active"), "Bar");
        expect(wrapper.findAll("choropleth-filters-stub").length).toBe(0);
        expect(wrapper.findAll("choropleth-stub").length).toBe(0);
        expect(wrapper.find("#barchart-container").classes()).toEqual(["col-md-12"]);
        expect(wrapper.findAll("barchart-stub").length).toBe(1);
    });

    it("computes chartdata", () => {
        const store = getStore();
        const wrapper = shallowMount(ModelOutput, {store, localVue});
        const vm = (wrapper as any).vm;

        expect(vm.chartdata).toStrictEqual(["TEST DATA"]);
    });

    it("computes barchart selections", () => {
        const store = getStore();
        const wrapper = shallowMount(ModelOutput, {store, localVue});
        const vm = (wrapper as any).vm;

        expect(vm.barchartSelections).toStrictEqual({
            indicatorId: "TestIndicator",
            xAxisId: "region",
            disaggregateById: "age",
            selectedFilterOptions: {
                region: {id: "r1", label: "region 1"},
                age: {id: "a1", label: "0-4"}
            }
        });
    });
});