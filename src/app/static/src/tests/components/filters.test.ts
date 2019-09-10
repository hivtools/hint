import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import Filters from "../../app/components/Filters.vue";
import {DataType, FilteredDataState, FilterType} from "../../app/store/filteredData/filteredData";
import {mockFilteredDataState} from "../mocks";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Filters component", () => {

    it("renders filter controls if selected data type", () => {
        const wrapper = getWrapper({selectedDataType: DataType.Survey});
        expect(wrapper.findAll("treeselect-stub").length).toBe(3);
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
        testInvokesStoreActionWhenFilterIsEdited(FilterType.Age);
    });

    it ("invokes store action when sex filter is edited", () => {
        testInvokesStoreActionWhenFilterIsEdited(FilterType.Sex);
    });

    it ("invokes store actions when survey filter is edited", () => {
        testInvokesStoreActionWhenFilterIsEdited(FilterType.Survey);
    });

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

    const testInvokesStoreActionWhenFilterIsEdited = function(filterType: FilterType){
        const mockFilterUpdated = jest.fn();
        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState(),
                    actions: {
                        filterUpdated: mockFilterUpdated
                    }
                }
            }
        });
        const wrapper = shallowMount(Filters, {localVue, store});
        const vm = (wrapper as any).vm;
        const newFilter = ["v1", "v2"];
        switch(filterType) {
            case (FilterType.Sex):
                vm.updateSexFilter(newFilter);
                break;
            case (FilterType.Age):
                vm.updateAgeFilter(newFilter);
                break;
            case (FilterType.Survey):
                vm.updateSurveyFilter(newFilter);
                break;
            default:
                throw "FilterType not supported by test"
        }

        expect(mockFilterUpdated.mock.calls[0][1]).toStrictEqual([filterType, newFilter]);
    }

});