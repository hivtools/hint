import {createLocalVue, mount, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import Filters from "../../app/components/Filters.vue";
import {DataType, FilteredDataState, FilterType} from "../../app/store/filteredData/filteredData";
import { getters } from '../../app/store/filteredData/getters';
import {mockFilteredDataState} from "../mocks";
import {FilteredDataActions} from "../../app/store/filteredData/actions";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Step component", () => {

    const getWrapper = (state?: Partial<FilteredDataState>, selectedDataFilterOptions: object = {}) => {

        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState(state),
                    getters: {
                        selectedDataFilterOptions: () => selectedDataFilterOptions
                    }
                }
            }
        });
        return shallowMount(Filters, {localVue, store});
    };

    it("renders filter controls if selected data type", () => {
        const wrapper = getWrapper({selectedDataType: DataType.Survey});
        expect(wrapper.findAll("treeselect-stub").length).toBe(2);
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
        const sexFilters = (wrapper as any).vm.sexFilters.available;
        expect(sexFilters).toStrictEqual([
            {"id": "female", "label": "female"},
            {"id": "male", "label": "male"},
            {"id": "both", "label": "both"}
            ]);
    });

    it ("computes available sexFilters for ANC", () => {
        const wrapper = getWrapper({selectedDataType: DataType.ANC});
        const sexFilters = (wrapper as any).vm.sexFilters.available;
        expect(sexFilters).toStrictEqual([
            {"id": "female", "label": "female"}
            ]);
    });

    it ("computes available ageFilters", () => {
        const wrapper = getWrapper({selectedDataType: DataType.Survey},
            {age: ["0-4", "5-9", "10-15"]});
        const ageFilters = (wrapper as any).vm.ageFilters.available;
        expect(ageFilters).toStrictEqual([
            {"id": "0-4", "label": "0-4"},
            {"id": "5-9", "label": "5-9"},
            {"id": "10-15", "label": "10-15"}
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

    it ("invokes store action when age filter is selected", () => {
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
        (wrapper as any).vm.ageFilterSelected({id: "0-5", label: "0-5"});

        expect(mockFilterAdded.mock.calls[0][1]).toStrictEqual([FilterType.Age, "0-5"]);
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

    it ("invokes store action when age filter is deselected", () => {
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
        (wrapper as any).vm.ageFilterDeselected({id: "0-5", label: "0-5"});

        expect(mockFilterRemoved.mock.calls[0][1]).toStrictEqual([FilterType.Age, "0-5"]);
    });

});