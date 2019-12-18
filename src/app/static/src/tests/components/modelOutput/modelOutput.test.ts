import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vuex from 'vuex';
import ModelOutput from "../../../app/components/modelOutput/ModelOutput.vue";
import {
    mockBaselineState,
    mockFilteredDataState, mockModelResultResponse,
    mockModelRunState, mockShapeResponse,
} from "../../mocks";
import {DataType} from "../../../app/store/filteredData/filteredData";
import {actions} from "../../../app/store/filteredData/actions";
import {mutations as filteredDataMutations} from "../../../app/store/filteredData/mutations";
import {mutations as modelOutputMutations} from "../../../app/store/modelOutput/mutations";
import {ModelOutputState} from "../../../app/store/modelOutput/modelOutput";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState} from "../../../app/root";
import {login} from "../../integration/integrationTest";
import {inactiveFeatures} from "../../../app/main";

const localVue = createLocalVue();

function getStore(modelOutputState: Partial<ModelOutputState> = {}) {
    const store = new Vuex.Store({
        state: emptyState(),
        modules: {
            baseline: {
                namespaced: true,
                state: mockBaselineState({
                    shape: mockShapeResponse({
                        data: {
                            features: ["TEST FEATURES"] as any
                        } as any,
                        filters: {
                            level_labels: ["TEST LEVEL LABELS"] as any
                        }
                    })
                })
            },
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
                    barchartFilters: jest.fn(),
                    bubblePlotIndicators: jest.fn().mockReturnValue(["TEST BUBBLE INDICATORS"])
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
    registerTranslations(store);
    return store;
}

describe("ModelOutput component", () => {
    beforeAll(async () => {
        inactiveFeatures.splice(0, inactiveFeatures.length);
    });

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
        expect(activeTab.text()).toBe("Map");
    });

    it("gets selected tab from state", () => {
        const store = getStore({selectedTab: "bar"});
        const wrapper = shallowMount(ModelOutput, {localVue, store});

        const activeTab = wrapper.find("a.active");
        expect(activeTab.text()).toBe("Bar");
    });

    it("can change tabs", () => {

        const store = getStore();
        const wrapper = shallowMount(ModelOutput, {store, localVue});

        expect(wrapper.find(".nav-link.active").text()).toBe("Map");
        expect(wrapper.findAll("choropleth-filters-stub").length).toBe(1);
        expect(wrapper.findAll("choropleth-stub").length).toBe(1);

        expect(wrapper.find("#barchart-container").classes()).toEqual(["d-none"]);

        expect(wrapper.findAll("#bubble-plot-container").length).toBe(0);
        expect(wrapper.findAll("bubble-plot-stub").length).toBe(0);

        //should invoke mutation
        wrapper.findAll(".nav-link").at(1).trigger("click");

        expect(wrapper.find(".nav-link.active").text()).toBe("Bar");
        expect(wrapper.findAll("choropleth-filters-stub").length).toBe(0);
        expect(wrapper.findAll("choropleth-stub").length).toBe(0);

        expect(wrapper.find("#barchart-container").classes()).toEqual(["col-md-12"]);
        expect(wrapper.findAll("barchart-stub").length).toBe(1);

        expect(wrapper.findAll("#bubble-plot-container").length).toBe(0);
        expect(wrapper.findAll("bubble-plot-stub").length).toBe(0);

        wrapper.findAll(".nav-link").at(2).trigger("click");

        expect(wrapper.find(".nav-link.active").text()).toBe("Bubble Plot");
        expect(wrapper.findAll("choropleth-filters-stub").length).toBe(0);
        expect(wrapper.findAll("choropleth-stub").length).toBe(0);

        expect(wrapper.find("#barchart-container").classes()).toEqual(["d-none"]);

        expect(wrapper.findAll("#bubble-plot-container").length).toBe(1);
        expect(wrapper.findAll("bubble-plot-stub").length).toBe(1);
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

    it("computes bubble plot indicators", () => {
        const store = getStore();
        const wrapper = shallowMount(ModelOutput, {store, localVue});
        const vm = (wrapper as any).vm;

        expect(vm.bubblePlotIndicators).toStrictEqual(["TEST BUBBLE INDICATORS"]);
    });

    it("computes features", () => {
        const store = getStore();
        const wrapper = shallowMount(ModelOutput, {store, localVue});
        const vm = (wrapper as any).vm;

        expect(vm.features).toStrictEqual(["TEST FEATURES"]);
    });

    it("computes feature levels", () => {
        const store = getStore();
        const wrapper = shallowMount(ModelOutput, {store, localVue});
        const vm = (wrapper as any).vm;

        expect(vm.featureLevels).toStrictEqual(["TEST LEVEL LABELS"]);
    });
});