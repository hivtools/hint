import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import ModelOutput from "../../../app/components/modelOutput/ModelOutput.vue";
import {
    mockAncResponse,
    mockFilteredDataState, mockModelResultResponse,
    mockModelRunState,
    mockProgramResponse,
    mockSurveyResponse,
} from "../../mocks";
import {DataType} from "../../../app/store/filteredData/filteredData";
import {actions} from "../../../app/store/filteredData/actions";
import {mutations} from "../../../app/store/filteredData/mutations";

const localVue = createLocalVue();
Vue.use(Vuex);

function getStore() {
    return new Vuex.Store({
        modules: {
            filteredData: {
                namespaced: true,
                state: mockFilteredDataState(),
                actions: actions,
                mutations: mutations
            },
            modelRun: {
                namespaced: true,
                state: mockModelRunState({
                    result: mockModelResultResponse({data: ["TEST DATA"] as any})
                })
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

    it("can change tabs", () => {
        const store = getStore();
        const wrapper = shallowMount(ModelOutput, {store, localVue});

        expect(wrapper.find(".nav-link.active").text()).toBe("Map");
        expect(wrapper.findAll("choropleth-filters-stub").length).toBe(1);
        expect(wrapper.findAll("choropleth-stub").length).toBe(1);
        expect(wrapper.find("#barchart-container").classes()).toEqual(["d-none"]);

        wrapper.findAll(".nav-link").at(1).trigger("click");

        expect(wrapper.find(".nav-link.active").text()).toBe("Bar");
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
});