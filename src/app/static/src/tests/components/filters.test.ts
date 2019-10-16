import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import Filters from "../../app/components/plots/Filters.vue";
import {
    DataType,
    FilteredDataState,
    FilterType,
    initialSelectedFilters
} from "../../app/store/filteredData/filteredData";
import {mockFilteredDataState} from "../mocks";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Filters component", () => {

    const stubGetters = {
        selectedDataFilterOptions: () => {
            return {};
        }
    };

    it ("computes available sexFilters for non-ANC", () => {
        const wrapper = getWrapper({selectedDataType: DataType.Survey});
        const sexFilters = (wrapper as any).vm.sexFilters;
        expect(sexFilters.available).toStrictEqual([
            {"id": "female", "name": "female"},
            {"id": "male", "name": "male"},
            {"id": "both", "name": "both"}
            ]);
    });

    it ("computes available sexFilters for ANC", () => {
        const wrapper = getWrapper({selectedDataType: DataType.ANC});
        const sexFilters = (wrapper as any).vm.sexFilters;
        expect(sexFilters.available).toStrictEqual([
            {"id": "female", "name": "female"}
            ]);
    });

    it ("computes ageFilters", () => {
        const stateAgeFilterOptions = [
            {id: "a1", name: "0-4"},
            {id: "a2", name: "5-9"}
        ];
        const mockSelectedFilters = {
            ...initialSelectedFilters,
            age: [ {id: "a1", name: "0-4"}]
        };
        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState({selectedFilters: mockSelectedFilters}),
                    getters: {
                        selectedDataFilterOptions: () => {
                            return {
                                age: stateAgeFilterOptions
                            }
                        }
                    }
                }
            }
        });
        const wrapper = shallowMount(Filters, {localVue, store});
        const vm = (wrapper as any).vm;
        const ageFilters = vm.ageFilters;
        expect(ageFilters.available).toStrictEqual(stateAgeFilterOptions);
        expect(ageFilters.selected).toStrictEqual([ "a1" ]);
    });

    it ("computes selected sexFilters", () => {
        const mockSelectedFilters = {
            ...initialSelectedFilters,
            sex: [ {id: "both", name: "both"}]
        };
        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState({selectedFilters: mockSelectedFilters}),
                    getters: stubGetters
                }
            }
        });
        const wrapper = shallowMount(Filters, {localVue, store});
        const vm = (wrapper as any).vm;
        const sexFilters = vm.sexFilters;
        expect(sexFilters.selected).toStrictEqual([ "both" ]);
    });

    it ("computes surveyFilters", () => {
        const stateSurveyFilterOptions = [
            {id: "s1", name: "survey 1"},
            {id: "s2", name: "survey 2"}
        ];
        const mockSelectedFilters = {
            ...initialSelectedFilters,
            surveys: [ {id: "s1", name: "survey 1"}]
        };
        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState({selectedFilters: mockSelectedFilters}),
                    getters: {
                        selectedDataFilterOptions: () => {
                            return {
                                surveys: stateSurveyFilterOptions
                            }
                        }
                    }
                }
            }
        });
        const wrapper = shallowMount(Filters, {localVue, store});
        const vm = (wrapper as any).vm;
        const surveyFilters = vm.surveyFilters;
        expect(surveyFilters.available).toStrictEqual(stateSurveyFilterOptions);
        expect(surveyFilters.selected).toStrictEqual([ "s1" ]);
    });

    it ("computes regionFilters", () => {
        const stateRegionFilterOptions =  [
            {name: "Northern Region", id: "MWI.1", options: [
                    {name: "Chitipa", id: "MWI.1.1"},
                    {name: "Karonga", id: "MWI.1.2"}
                ]},
            {name: "Central Region", id: "MWI.2", options: [
                    {name: "Dowa", id: "MWI.2.2"}
                ]}
        ];
        const mockSelectedFilters = {
            ...initialSelectedFilters,
            region: [
                {name: "Karonga", id: "MWI.1.2"},
                {name: "Central Region", id: "MWI.2", options: [
                    {name: "Dowa", id: "MWI.2.2"}
                ]}]
        };

        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState({selectedFilters: mockSelectedFilters}),
                    getters: {
                        regionOptions: () => {
                            return stateRegionFilterOptions;
                        },
                        selectedDataFilterOptions: () => {
                            return {};
                        }
                    }
                }
            }
        });
        const wrapper = shallowMount(Filters, {localVue, store});
        const vm = (wrapper as any).vm;
        const regionFilters = vm.regionFilters;
        expect(regionFilters.available).toStrictEqual(stateRegionFilterOptions);
        expect(regionFilters.selected).toStrictEqual([ "MWI.1.2", "MWI.2"]);
    });

    it ("invokes store action when sex filter is edited", () => {
        const mockFilterUpdated = jest.fn();
        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState(),
                    actions: {
                        filterUpdated: mockFilterUpdated
                    },
                    getters: {
                        selectedDataFilterOptions: () => {
                            return {};
                        }
                    }
                }
            }
        });
        const wrapper = shallowMount(Filters, {localVue, store});
        const vm = (wrapper as any).vm;
        const newFilter = ["female", "both"];
        vm.updateSexFilter(newFilter);

        expect(mockFilterUpdated.mock.calls[0][1]).toStrictEqual([FilterType.Sex, [
            {id: "female", name: "female"},
            {id: "both", name: "both"}
        ]]);
    });

    it ("invokes store actions when surveys filter is edited", () => {
        const mockFilterUpdated = jest.fn();
        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState(),
                    actions: {
                        filterUpdated: mockFilterUpdated
                    },
                    getters: {
                        selectedDataFilterOptions: () => {
                            return {
                                surveys: [
                                    {id: "s1", name: "survey 1"},
                                    {id: "s2", name: "survey 2"}
                                ]
                            }
                        }
                    }
                }
            }
        });
        const wrapper = shallowMount(Filters, {localVue, store});
        const vm = (wrapper as any).vm;
        const newFilter = ["s1"];
        vm.updateSurveyFilter(newFilter);

        expect(mockFilterUpdated.mock.calls[0][1]).toStrictEqual([FilterType.Survey, [
            {id: "s1", name: "survey 1"}
        ]]);
    });

    it ("invokes store actions when age filter is edited", () => {
        const mockFilterUpdated = jest.fn();
        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState(),
                    actions: {
                        filterUpdated: mockFilterUpdated
                    },
                    getters: {
                        selectedDataFilterOptions: () => {
                            return {
                                age: [
                                    {id: "a1", name: "0-4"},
                                    {id: "a2", name: "5-9"}
                                ]
                            }
                        }
                    }
                }
            }
        });
        const wrapper = shallowMount(Filters, {localVue, store});
        const vm = (wrapper as any).vm;
        const newFilter = ["a1", "a2"];
        vm.updateAgeFilter(newFilter);

        expect(mockFilterUpdated.mock.calls[0][1]).toStrictEqual([FilterType.Age, [
            {id: "a1", name: "0-4"},
            {id: "a2", name: "5-9"}
        ]]);
    });

    it ("invokes store actions when region filter is edited", () => {
        const mockFilterUpdated = jest.fn();
        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState(),
                    actions: {
                        filterUpdated: mockFilterUpdated
                    },
                    getters: {
                        ...stubGetters,
                        regionOptions: () => {
                            return [
                                    {name: "Northern Region", id: "MWI.1", options: [
                                            {name: "Chitipa", id: "MWI.1.1"},
                                            {name: "Karonga", id: "MWI.1.2"}
                                        ]},
                                    {name: "Central Region", id: "MWI.2", options: [
                                            {name: "Dowa", id: "MWI.2.2"}
                                        ]}
                                ]

                        }
                    }
                }
            }
        });
        const wrapper = shallowMount(Filters, {localVue, store});
        const vm = (wrapper as any).vm;
        const newFilter = ["MWI.1.1", "MWI.1.2", "MWI.2"];
        vm.updateRegionFilter(newFilter);

        expect(mockFilterUpdated.mock.calls[0][1]).toStrictEqual([FilterType.Region, [
            {name: "Chitipa", id: "MWI.1.1"},
            {name: "Karonga", id: "MWI.1.2"},
            {name: "Central Region", id: "MWI.2", options: [
                    {name: "Dowa", id: "MWI.2.2"}
                ]}
        ]]);
    });

    it ("transforms FilterOption in treeselectNormalizer", () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;
        const result = vm.treeselectNormalizer({id: "1", name: "name1"});
        expect(result).toStrictEqual({id: "1", label: "name1"});
    });

    it ("transforms NestedFilterOption in treeselectNormalizer", () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;
        const result = vm.treeselectNormalizer(
            {
                id: "1",
                name: "name1",
                options:
                    [
                        {id: "1.1", name: "name1.1"},
                        {id: "1.2", name: "name1.2"}
                    ]
            });
        expect(result).toStrictEqual(
            {
                id: "1",
                label: "name1",
                children:
                    [
                        {id: "1.1", label: "name1.1"},
                        {id: "1.2", label: "name1.2"}
                    ]
            });
    });

    it ("returns child treenode unchanged in treeselectNormalizer", () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;
        const result = vm.treeselectNormalizer({id: "1", label: "name1"});
        expect(result).toStrictEqual({id: "1", label: "name1"});
    });

    const getWrapper = (state?: Partial<FilteredDataState>, selectedDataFilterOptions: object = {}) => {

        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState(state),
                    getters: stubGetters
                }
            }
        });
        return shallowMount(Filters, {localVue, store});
    };

});