import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import ChoroplethFilters from "../../app/components/ChoroplethFilters.vue";
import {
    DataType,
    FilteredDataState,
    FilterType,
    initialSelectedChoroplethFilters
} from "../../app/store/filteredData/filteredData";
import {mockFilteredDataState} from "../mocks";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("ChoroplethFilters component", () => {

    const stubGetters = {
        selectedDataFilterOptions: () => {
            return {};
        }
    };

    it ("computes available sexFilters for non-ANC", () => {
        const wrapper = getWrapper({selectedDataType: DataType.Survey});
        const sexFilters = (wrapper as any).vm.sexFilters;
        expect(sexFilters.available).toStrictEqual([
            {"id": "both", "name": "both"},
            {"id": "female", "name": "female"},
            {"id": "male", "name": "male"}
        ]);
    });

    it ("computes available sexFilters for ANC", () => {
        const wrapper = getWrapper({selectedDataType: DataType.ANC});
        const sexFilters = (wrapper as any).vm.sexFilters;
        expect(sexFilters.available).toBeUndefined();
    });

    it ("computes ageFilters", () => {
        const stateAgeFilterOptions = [
            {id: "a1", name: "0-4"},
            {id: "a2", name: "5-9"}
        ];
        const mockSelectedFilters = {
            ...initialSelectedChoroplethFilters,
            age: {id: "a1", name: "0-4"}
        };
        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState({selectedChoroplethFilters: mockSelectedFilters}),
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
        const wrapper = shallowMount(ChoroplethFilters, {localVue, store});
        const vm = (wrapper as any).vm;
        const ageFilters = vm.ageFilters;
        expect(ageFilters.available).toStrictEqual(stateAgeFilterOptions);
        expect(ageFilters.selected).toStrictEqual( "a1" );
    });

    it ("computes selected sexFilters", () => {
        const mockSelectedFilters = {
            ...initialSelectedChoroplethFilters,
            sex: {id: "both", name: "both"}
        };
        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState({selectedChoroplethFilters: mockSelectedFilters}),
                    getters: stubGetters
                }
            }
        });
        const wrapper = shallowMount(ChoroplethFilters, {localVue, store});
        const vm = (wrapper as any).vm;
        const sexFilters = vm.sexFilters;
        expect(sexFilters.selected).toStrictEqual( "both" );
    });

    it ("computes surveyFilters", () => {
        const stateSurveyFilterOptions = [
            {id: "s1", name: "survey 1"},
            {id: "s2", name: "survey 2"}
        ];
        const mockSelectedFilters = {
            ...initialSelectedChoroplethFilters,
            survey: {id: "s1", name: "survey 1"}
        };
        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState({selectedChoroplethFilters: mockSelectedFilters}),
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
        const wrapper = shallowMount(ChoroplethFilters, {localVue, store});
        const vm = (wrapper as any).vm;
        const surveyFilters = vm.surveyFilters;
        expect(surveyFilters.available).toStrictEqual(stateSurveyFilterOptions);
        expect(surveyFilters.selected).toStrictEqual( "s1" );
    });

    it ("invokes store action when sex filter is edited", () => {
        const mockFilterUpdated = jest.fn();
        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState(),
                    actions: {
                        choroplethFilterUpdated: mockFilterUpdated
                    },
                    getters: {
                        selectedDataFilterOptions: () => {
                            return {};
                        }
                    }
                }
            }
        });
        const wrapper = shallowMount(ChoroplethFilters, {localVue, store});
        const vm = (wrapper as any).vm;

        const callCount = mockFilterUpdated.mock.calls.length;

        const newFilter = "female";
        vm.selectSex(newFilter);

        expect(mockFilterUpdated.mock.calls[callCount][1]).toStrictEqual([FilterType.Sex,  {id: "female", name: "female"}]);
    });

    it ("invokes store actions when survey filter is edited", () => {
        const mockFilterUpdated = jest.fn();
        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState(),
                    actions: {
                        choroplethFilterUpdated: mockFilterUpdated
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
        const wrapper = shallowMount(ChoroplethFilters, {localVue, store});
        const vm = (wrapper as any).vm;

        const callCount = mockFilterUpdated.mock.calls.length;
        const newFilter = "s1" ;
        vm.selectSurvey(newFilter);

        expect(mockFilterUpdated.mock.calls[callCount][1]).toStrictEqual([FilterType.Survey, {id: "s1", name: "survey 1"}]);
    });

    it ("invokes store actions when age filter is edited", () => {
        const mockFilterUpdated = jest.fn();
        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState(),
                    actions: {
                        choroplethFilterUpdated: mockFilterUpdated
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
        const wrapper = shallowMount(ChoroplethFilters, {localVue, store});
        const vm = (wrapper as any).vm;
        const callCount = mockFilterUpdated.mock.calls.length;

        const newFilter = "a2";
        vm.selectAge(newFilter);

        expect(mockFilterUpdated.mock.calls[callCount][1]).toStrictEqual([FilterType.Age, {id: "a2", name: "5-9"}]);
    });

    it ("transforms FilterOption in treeselectNormalizer", () => {
        const wrapper = getWrapper();
        const vm = (wrapper as any).vm;
        const result = vm.treeselectNormalizer({id: "1", name: "name1"});
        expect(result).toStrictEqual({id: "1", label: "name1"});
    });

    it ("refreshSelectedChoroplethFilters leaves selected filters unchanged if they are available for new data type", () => {
        const stateAgeFilterOptions = [
            {id: "a1", name: "0-4"},
            {id: "a2", name: "5-9"}
        ];
        const stateSurveyFilterOptions = [
            {id: "s1", name: "Survey 1"},
            {id: "s2", name: "Survey 2"}
        ];
        const mockSelectedFilters = {
            age: {id: "a2", name: "5-9"},
            survey: {id: "s1", name: "Survey 1"},
            sex: {id: "female", name: "female"},
            updateByType: jest.fn(),
            getByType: jest.fn()
        };
        const mockFilterUpdated = jest.fn();
        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState({
                        selectedChoroplethFilters: mockSelectedFilters,
                        selectedDataType: DataType.Survey
                    }),
                    getters: {
                        selectedDataFilterOptions: () => {
                            return {
                                age: stateAgeFilterOptions,
                                survey: stateSurveyFilterOptions
                            }
                        }
                    },
                    actions: {
                        choroplethFilterUpdated: mockFilterUpdated
                    }
                }
            }
        });

        const wrapper = shallowMount(ChoroplethFilters, {localVue, store});
        const vm = (wrapper as any).vm;
        const callCount = mockFilterUpdated.mock.calls.length;

        vm.refreshSelectedChoroplethFilters();
        expect(mockFilterUpdated.mock.calls.length).toBe(callCount); //no more updates
    });

    it ("refreshSelectedChoroplethFilters uses first available filter options when existing filters unavailable for new data type", () => {
        const stateAgeFilterOptions = [
            {id: "a1", name: "0-4"},
            {id: "a2", name: "5-9"}
        ];
        const mockSelectedFilters = {
            age: {id: "a3", name: "10-15"},
            survey:  {id: "s1", name: "Survey 1"},
            sex: {id: "male", name: "male"},
            updateByType: jest.fn(),
            getByType: jest.fn()
        };
        const mockFilterUpdated = jest.fn();
        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState({
                        selectedChoroplethFilters: mockSelectedFilters,
                        selectedDataType: DataType.ANC
                    }),
                    getters: {
                        selectedDataFilterOptions: () => {
                            return {
                                age: stateAgeFilterOptions,
                                survey: null
                            }
                        }
                    },
                    actions: {
                        choroplethFilterUpdated: mockFilterUpdated
                    }
                }
            }
        });

        const wrapper = shallowMount(ChoroplethFilters, {localVue, store});
        const vm = (wrapper as any).vm;
        const callCount = mockFilterUpdated.mock.calls.length;

        vm.refreshSelectedChoroplethFilters();
        //Sex should be left unchanged as there are no available sex options for ANC
        expect(mockFilterUpdated.mock.calls.length).toBe(callCount+1);
        expect(mockFilterUpdated.mock.calls[callCount][1]).toStrictEqual([FilterType.Age, {id: "a1", name: "0-4"}]);

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
        return shallowMount(ChoroplethFilters, {localVue, store});
    };

});