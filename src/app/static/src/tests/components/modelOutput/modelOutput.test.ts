import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vuex from 'vuex';
import ModelOutput from "../../../app/components/modelOutput/ModelOutput.vue";
import {
    mockBaselineState,
    mockModelResultResponse,
    mockModelRunState, mockShapeResponse,
} from "../../mocks";
import {mutations as modelOutputMutations} from "../../../app/store/modelOutput/mutations";
import {ModelOutputState} from "../../../app/store/modelOutput/modelOutput";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState} from "../../../app/root";
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
                    bubblePlotIndicators: jest.fn().mockReturnValue(["TEST BUBBLE INDICATORS"]),
                    bubblePlotFilters: jest.fn().mockReturnValue(["TEST BUBBLE FILTERS"]),
                    choroplethFilters: jest.fn().mockReturnValue(["TEST CHORO FILTERS"]),
                    choroplethIndicators: jest.fn().mockReturnValue(["TEST CHORO INDICATORS"])
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
                    },
                    bubble: {test: "TEST BUBBLE SELECTIONS"} as any,
                    outputChoropleth: {test: "TEST CHORO SELECTIONS"} as any
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

    it("renders choropleth", () => {
        const store = getStore();
        const wrapper = shallowMount(ModelOutput, {localVue, store});

        const choro = wrapper.find("choropleth-stub");
        expect(choro.props().includeFilters).toBe(true);
        expect(choro.props().areaFilterId).toBe("area");
        expect(choro.props().filters).toStrictEqual(["TEST CHORO FILTERS"]);
        expect(choro.props().selections).toStrictEqual({test: "TEST CHORO SELECTIONS"});
        expect(choro.props().indicators).toStrictEqual(["TEST CHORO INDICATORS"]);

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

    it("computes bubble plot selections", () => {
        const store = getStore();
        const wrapper = shallowMount(ModelOutput, {store, localVue});
        const vm = (wrapper as any).vm;

        expect(vm.bubblePlotSelections).toStrictEqual({test: "TEST BUBBLE SELECTIONS"});
    });

    it("computes bubble plot filters", () => {
        const store = getStore();
        const wrapper = shallowMount(ModelOutput, {store, localVue});
        const vm = (wrapper as any).vm;

        expect(vm.bubblePlotFilters).toStrictEqual(["TEST BUBBLE FILTERS"]);
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