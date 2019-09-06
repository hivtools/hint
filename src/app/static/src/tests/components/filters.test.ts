import {createLocalVue, mount, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import Filters from "../../app/components/Filters.vue";
import {DataType, FilteredDataState, FilterType} from "../../app/store/filteredData/filteredData";
import {mockFilteredDataState} from "../mocks";
import {FilteredDataActions} from "../../app/store/filteredData/actions";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Step component", () => {

    const getWrapper = (state?: Partial<FilteredDataState>) => {

        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState(state)
                }
            }
        });
        return shallowMount(Filters, {localVue, store});
    };

    it("renders filter controls if selected data type", () => {
        const wrapper = getWrapper({selectedDataType: DataType.Survey});
        expect(wrapper.findAll("treeselect-stub").length).toBe(1);
    });

    it("does not render filter controls if no selected data type", () => {
        const wrapper = getWrapper();
        expect(wrapper.findAll("treeselect-stub").length).toBe(0);
    });

    it ("computes hasSelectedDataType when true", () => {
        const wrapper = getWrapper({selectedDataType: DataType.Survey});
        expect((wrapper as any).vm.hasSelectedDataType).toBe(true);
    });

    it ("computes hasSelectedDataType when false", () => {
        const wrapper = getWrapper();
        expect((wrapper as any).vm.hasSelectedDataType).toBe(false);
    });

    it ("computes available sexFilters for non-ANC", () => {
        const wrapper = getWrapper({selectedDataType: DataType.Survey});
        const sexFilters = (wrapper as any).vm.sexFilters.available as string[];
        expect(sexFilters).toStrictEqual([
            {"id": "female", "label": "female"},
            {"id": "male", "label": "male"},
            {"id": "both", "label": "both"}
            ]);
    });

    it ("computes available sexFilters for ANC", () => {
        const wrapper = getWrapper({selectedDataType: DataType.ANC});
        const sexFilters = (wrapper as any).vm.sexFilters.available as string[];
        expect(sexFilters).toStrictEqual([
            {"id": "female", "label": "female"}
            ]);
    });

    it ("invokes store action when sex filter is selected", () => {
        const mockFilterAdded = jest.fn();
        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState(),
                    actions: {
                        filterAdded: mockFilterAdded
                    }
                }
            }
        });
        const wrapper = shallowMount(Filters, {localVue, store});
        (wrapper as any).vm.sexFilterSelected({id: "both", label: "both"});

        expect(mockFilterAdded.mock.calls[0][1]).toStrictEqual([FilterType.Sex, "both"]);
    });

    it ("invokes store action when sex filter is deselected", () => {
        const mockFilterRemoved = jest.fn();
        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState(),
                    actions: {
                        filterRemoved: mockFilterRemoved
                    }
                }
            }
        });
        const wrapper = shallowMount(Filters, {localVue, store});
        (wrapper as any).vm.sexFilterDeselected({id: "both", label: "both"});

        expect(mockFilterRemoved.mock.calls[0][1]).toStrictEqual([FilterType.Sex, "both"]);
    });
});