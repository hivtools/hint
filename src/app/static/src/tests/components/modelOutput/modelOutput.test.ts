import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vuex from 'vuex';
import ModelOutput from "../../../app/components/modelOutput/ModelOutput.vue";
import {
    mockBaselineState,
    mockModelResultResponse,
    mockModelRunState, mockShapeResponse,
} from "../../mocks";
import {mutations as modelOutputMutations} from "../../../app/store/modelOutput/mutations";
import {mutations as plottingSelectionMutations} from "../../../app/store/plottingSelections/mutations";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState} from "../../../app/root";
import {inactiveFeatures} from "../../../app/main";
import {BarChartWithFilters} from "@reside-ic/vue-charts";
import {ModelOutputState} from "../../../app/store/modelOutput/modelOutput";
import Choropleth from "../../../app/components/plots/choropleth/Choropleth.vue";
import BubblePlot from "../../../app/components/plots/bubble/BubblePlot.vue";

const localVue = createLocalVue();

function getStore(modelOutputState: Partial<ModelOutputState> = {}, partialGetters = {}, partialSelections = {}) {
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
                    barchartIndicators: jest.fn().mockReturnValue(["TEST BARCHART INDICATORS"]),
                    barchartFilters: jest.fn().mockReturnValue(["TEST BAR FILTERS"]),
                    bubblePlotIndicators: jest.fn().mockReturnValue(["TEST BUBBLE INDICATORS"]),
                    bubblePlotFilters: jest.fn().mockReturnValue(["TEST BUBBLE FILTERS"]),
                    choroplethFilters: jest.fn().mockReturnValue(["TEST CHORO FILTERS"]),
                    choroplethIndicators: jest.fn().mockReturnValue(["TEST CHORO INDICATORS"]),
                    ...partialGetters
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
                    outputChoropleth: {test: "TEST CHORO SELECTIONS"} as any,
                    colourScales: {
                        output: {test: "TEST OUTPUT COLOUR SCALES"} as any
                    },
                    ...partialSelections
                },
                mutations: plottingSelectionMutations
            }
        }
    });
    registerTranslations(store);
    return store;
}

declare let currentUser: string;
currentUser = "guest";

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
        expect(choro.props().colourScales).toStrictEqual({test: "TEST OUTPUT COLOUR SCALES"});
    });

    it("renders bubble plot", () => {
        const store = getStore({selectedTab: "bubble"});
        const wrapper = shallowMount(ModelOutput, {localVue, store});

        const bubble = wrapper.find(BubblePlot);
        expect(bubble.props().areaFilterId).toBe("area");
        expect(bubble.props().filters).toStrictEqual(["TEST BUBBLE FILTERS"]);
        expect(bubble.props().selections).toStrictEqual({test: "TEST BUBBLE SELECTIONS"});
        expect(bubble.props().indicators).toStrictEqual(["TEST BUBBLE INDICATORS"]);
        expect(bubble.props().colourScales).toStrictEqual({test: "TEST OUTPUT COLOUR SCALES"});
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
        expect(wrapper.findAll(BarChartWithFilters).length).toBe(1);

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

    it("computes barchart filters", () => {
        const store = getStore();
        const wrapper = shallowMount(ModelOutput, {store, localVue});
        const vm = (wrapper as any).vm;

        expect(vm.filterConfig).toStrictEqual({
            indicatorLabel: "Indicator",
            xAxisLabel: "X Axis",
            disaggLabel: "Disaggregate by",
            filterLabel: "Filters",
            filters: ["TEST BAR FILTERS"]
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

    it("commits updated colour scale from choropleth", () => {
        const store = getStore();
        const wrapper = shallowMount(ModelOutput, {store, localVue});

        const choro = wrapper.find(Choropleth);
        const newColourScales = {test: "NEW COLOUR SCALES"};
        choro.vm.$emit("updateColourScales", newColourScales);
        expect(store.state.plottingSelections.colourScales.output).toBe(newColourScales);
    });

    it("commits updated colour scale from bubble plot", () => {
        const store = getStore( {selectedTab: "bubble"});
        const wrapper = shallowMount(ModelOutput, {store, localVue});

        const bubble = wrapper.find(BubblePlot);
        const bubbleColourScales = {test: "NEW BUBBLE COLOUR SCALES"};
        bubble.vm.$emit("updateColourScales", bubbleColourScales);
        expect(store.state.plottingSelections.colourScales.output).toBe(bubbleColourScales);
    });

    it("renders choropleth table", () => {
        const store = getStore();
        const wrapper = shallowMount(ModelOutput, {localVue, store});

        const table = wrapper.find("table-view-stub");
        expect(table.props().areaFilterId).toBe("area");
        expect(table.props().filters).toStrictEqual(["TEST CHORO FILTERS"]);
        expect(table.props().selections).toStrictEqual({test: "TEST CHORO SELECTIONS"});
        expect(table.props().indicators).toStrictEqual(["TEST CHORO INDICATORS"]);
        expect(table.props().tabledata).toStrictEqual(["TEST DATA"]);
    });

    it("renders choropleth table with correct indicator props", () => {
        const store = getStore({}, {
            choroplethIndicators: jest.fn().mockReturnValue(
                [ 
                    { "indicator": "prevalence", "indicator_value": "2" }, 
                    { "indicator": "art_coverage", "indicator_value": "4" }
                ]
            )
    }, 
    {
        outputChoropleth: {indicatorId: "art_coverage"}
    });
        const wrapper = shallowMount(ModelOutput, {localVue, store});

        const table = wrapper.find("table-view-stub");
        expect(table.props().selections).toStrictEqual({indicatorId: "art_coverage"});
        expect(table.props().indicators).toStrictEqual([ { "indicator": "art_coverage", "indicator_value": "4" } ]);
    });

    it("renders bubble plot table", () => {
        const store = getStore({selectedTab: "bubble"});
        const wrapper = shallowMount(ModelOutput, {localVue, store});

        const table = wrapper.findAll("table-view-stub").at(1);
        expect(table.props().areaFilterId).toBe("area");
        expect(table.props().filters).toStrictEqual(["TEST BUBBLE FILTERS"]);
        expect(table.props().selections).toStrictEqual({test: "TEST BUBBLE SELECTIONS"});
        expect(table.props().indicators).toStrictEqual(["TEST BUBBLE INDICATORS", "TEST BUBBLE INDICATORS"]);
        expect(table.props().tabledata).toStrictEqual(["TEST DATA"]);
    });

    it("renders bubble plot table with correct indicator props", () => {
        const store = getStore(
            {
                selectedTab: "bubble"
            },
            {
                bubblePlotIndicators: jest.fn().mockReturnValue(
                    [
                        {"indicator": "prevalence", "indicator_value": "2"},
                        {"indicator": "art_coverage", "indicator_value": "4"},
                        {"indicator": "current_art", "indicator_value": "6"}
                    ]
                )
            },
            {
                bubble: {colorIndicatorId: "art_coverage", sizeIndicatorId: "current_art"}
            });
        const wrapper = shallowMount(ModelOutput, {localVue, store});

        const table = wrapper.findAll("table-view-stub").at(1);
        expect(table.props().selections).toStrictEqual({colorIndicatorId: "art_coverage", sizeIndicatorId: "current_art"});
        expect(table.props().indicators).toStrictEqual(
            [
                {
                    "indicator": "art_coverage",
                    "indicator_value": "4"
                },
                {
                    "indicator": "current_art",
                    "indicator_value": "6"
                }
            ]
        );
    });

    it("renders barchart table", () => {
        const store = getStore({selectedTab: "bar"});
        const wrapper = shallowMount(ModelOutput, {localVue, store});

        const table = wrapper.find("table-view-stub");
        expect(table.props().areaFilterId).toBe("area");
        expect(table.props().filters).toStrictEqual(["TEST BAR FILTERS"]);
        expect(table.props().selections).toStrictEqual({
            indicatorId: "TestIndicator",
            xAxisId: "region",
            disaggregateById: "age",
            selectedFilterOptions: {
                region: {id: "r1", label: "region 1"},
                age: {id: "a1", label: "0-4"}
            }});
        expect(table.props().tabledata).toStrictEqual(["TEST DATA"]);
    });

    it("renders barchart table with correct indicator props", () => {
        const store = getStore({selectedTab: "bar"}, {
            barchartIndicators: jest.fn().mockReturnValue(
                [ 
                    { "indicator": "prevalence", "indicator_value": "2" }, 
                    { "indicator": "art_coverage", "indicator_value": "4" }
                ]
            )
    }, 
    {
        barchart: {indicatorId: "art_coverage"}
    });
        const wrapper = shallowMount(ModelOutput, {localVue, store});

        const table = wrapper.find("table-view-stub");
        expect(table.props().selections).toStrictEqual({indicatorId: "art_coverage"});
        expect(table.props().indicators).toStrictEqual(
            [ 
                { "indicator": "art_coverage", "indicator_value": "4" }
            ]
        );
    });
});
