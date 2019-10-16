import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex, {ActionTree} from 'vuex';
import ChoroplethFilters from "../../app/components/plots/ChoroplethFilters.vue";
import {
    DataType,
    FilteredDataState,
    FilterType,
    initialSelectedChoroplethFilters
} from "../../app/store/filteredData/filteredData";
import {mockFilteredDataState} from "../mocks";
import {getters} from "../../app/store/filteredData/getters";
import {actions as filterActions} from "../../app/store/filteredData/actions";
import {RootState} from "../../app/root";
import {mutations} from "../../app/store/filteredData/mutations";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("ChoroplethFilters component", () => {

    const stubGetters = {
        selectedDataFilterOptions: () => {
            return {};
        }
    };

    it("computes sexFilters", () => {
        const stateSexFilterOptions = [
            {id: "s1", name: "female"},
            {id: "s2", name: "male"}
        ];
        const mockGetters = {
            selectedDataFilterOptions: () => {
                return {
                    sex: stateSexFilterOptions
                }
            }
        };
        const wrapper = getWrapper({selectedDataType: DataType.Survey}, mockGetters);
        const sexFilters = (wrapper as any).vm.sexFilters;
        expect(sexFilters.available).toStrictEqual(stateSexFilterOptions);
    });

    it("computes ageFilters", () => {
        const stateAgeFilterOptions = [
            {id: "a1", name: "0-4"},
            {id: "a2", name: "5-9"}
        ];
        const mockSelectedFilters = {
            ...initialSelectedChoroplethFilters,
            age: {id: "a1", name: "0-4"}
        };

        const mockGetters = {
            selectedDataFilterOptions: () => {
                return {
                    age: stateAgeFilterOptions
                }
            }
        };
        const wrapper = getWrapper({selectedChoroplethFilters: mockSelectedFilters}, mockGetters);
        const vm = (wrapper as any).vm;
        const ageFilters = vm.ageFilters;
        expect(ageFilters.available).toStrictEqual(stateAgeFilterOptions);
        expect(ageFilters.selected).toStrictEqual("a1");
    });

    it("computes selected sexFilters", () => {
        const mockSelectedFilters = {
            ...initialSelectedChoroplethFilters,
            sex: {id: "both", name: "both"}
        };

        const wrapper = getWrapper({selectedChoroplethFilters: mockSelectedFilters});
        const vm = (wrapper as any).vm;
        const sexFilters = vm.sexFilters;
        expect(sexFilters.selected).toStrictEqual("both");
    });

    it("computes surveyFilters", () => {
        const stateSurveyFilterOptions = [
            {id: "s1", name: "survey 1"},
            {id: "s2", name: "survey 2"}
        ];
        const mockSelectedFilters = {
            ...initialSelectedChoroplethFilters,
            survey: {id: "s1", name: "survey 1"}
        };

        const mockState = {selectedChoroplethFilters: mockSelectedFilters};
        const mockGetters = {
            selectedDataFilterOptions: () => {
                return {
                    surveys: stateSurveyFilterOptions
                }
            }
        };

        const wrapper = getWrapper(mockState, mockGetters);
        const vm = (wrapper as any).vm;
        const surveyFilters = vm.surveyFilters;
        expect(surveyFilters.available).toStrictEqual(stateSurveyFilterOptions);
        expect(surveyFilters.selected).toStrictEqual("s1");
    });

    it("computes quarterFilters", () => {
        const stateQuarterFilterOptions = [
            {id: "1", name: "Jan-Mar 2019"},
            {id: "2", name: "Apr-Jun 2019"}
        ];
        const mockSelectedFilters = {
            ...initialSelectedChoroplethFilters,
            quarter: {id: "1", name: "Jan-Mar 2019"}
        };

        const mockState = {selectedChoroplethFilters: mockSelectedFilters};
        const mockGetters = {
            selectedDataFilterOptions: () => {
                return {
                    quarter: stateQuarterFilterOptions
                }
            }
        };

        const wrapper = getWrapper(mockState, mockGetters);
        const vm = (wrapper as any).vm;
        const quarterFilters = vm.quarterFilters;
        expect(quarterFilters.available).toStrictEqual(stateQuarterFilterOptions);
        expect(quarterFilters.selected).toStrictEqual("1");
    });

    it("computes regionFilters", () => {
        const stateRegionFilterOptions = [
            {
                id: "a1",
                name: "region",
                options: [
                    {id: "a2", name: "sub-region"}
                ]
            }];
        const mockSelectedFilters = {
            ...initialSelectedChoroplethFilters,
            regions: [{id: "a2", name: "sub-region"}]
        };
        const mockGetters = {
            selectedDataFilterOptions: () => {
                return {
                    regions: stateRegionFilterOptions
                }
            }
        };
        const wrapper = getWrapper(mockFilteredDataState({selectedChoroplethFilters: mockSelectedFilters}), mockGetters);
        const vm = (wrapper as any).vm;
        const regionFilters = vm.regionFilters;
        expect(regionFilters.available).toStrictEqual(stateRegionFilterOptions);
        expect(regionFilters.selected).toStrictEqual(["a2"]);
    });

    it("invokes store action when sex filter is edited", () => {
        const mockFilterUpdated = jest.fn();

        const mockActions = {
            choroplethFilterUpdated: mockFilterUpdated
        };
        const mockGetters = {
            selectedDataFilterOptions: () => {
                return {
                    sex: [{id: "female", name: "female"}, {id: "male", name: "male"}]
                };
            }
        };

        const wrapper = getWrapper({}, mockGetters, mockActions);
        const vm = (wrapper as any).vm;

        const callCount = mockFilterUpdated.mock.calls.length;

        const newFilter = "female";
        vm.selectSex(newFilter);

        expect(mockFilterUpdated.mock.calls[callCount][1]).toStrictEqual([FilterType.Sex, {
            id: "female",
            name: "female"
        }]);
    });

    it("invokes store actions when survey filter is edited", () => {
        const mockFilterUpdated = jest.fn();

        const mockActions = {
            choroplethFilterUpdated: mockFilterUpdated
        };
        const mockGetters = {
            selectedDataFilterOptions: () => {
                return {
                    surveys: [
                        {id: "s1", name: "survey 1"},
                        {id: "s2", name: "survey 2"}
                    ]
                }
            }
        };

        const wrapper = getWrapper({}, mockGetters, mockActions);
        const vm = (wrapper as any).vm;

        const callCount = mockFilterUpdated.mock.calls.length;
        const newFilter = "s1";
        vm.selectSurvey(newFilter);

        expect(mockFilterUpdated.mock.calls[callCount][1]).toStrictEqual([FilterType.Survey, {
            id: "s1",
            name: "survey 1"
        }]);
    });

    it("invokes store actions when age filter is edited", () => {
        const mockFilterUpdated = jest.fn();
        const mockActions = {
            choroplethFilterUpdated: mockFilterUpdated
        };
        const mockGetters = {
            selectedDataFilterOptions: () => {
                return {
                    age: [
                        {id: "a1", name: "0-4"},
                        {id: "a2", name: "5-9"}
                    ]
                }
            }
        };

        const wrapper = getWrapper({}, mockGetters, mockActions);
        const vm = (wrapper as any).vm;
        const callCount = mockFilterUpdated.mock.calls.length;

        const newFilter = "a2";
        vm.selectAge(newFilter);

        expect(mockFilterUpdated.mock.calls[callCount][1]).toStrictEqual([FilterType.Age, {id: "a2", name: "5-9"}]);
    });

    it("invokes store actions when quarter filter is edited", () => {
        const mockFilterUpdated = jest.fn();
        const mockActions = {
            choroplethFilterUpdated: mockFilterUpdated
        };
        const mockGetters = {
            selectedDataFilterOptions: () => {
                return {
                    quarter: [
                        {id: "1", name: "Jan-Mar 2019"},
                        {id: "2", name: "Apr-Jun 2019"}
                    ]
                }
            }
        };

        const wrapper = getWrapper({}, mockGetters, mockActions);
        const vm = (wrapper as any).vm;
        const callCount = mockFilterUpdated.mock.calls.length;

        const newFilter = "2";
        vm.selectQuarter(newFilter);

        expect(mockFilterUpdated.mock.calls[callCount][1]).toStrictEqual([FilterType.Quarter, {id: "2", name: "Apr-Jun 2019"}]);
    });

    it("invokes store actions when region filter is edited", () => {
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
                        ...getters,
                        selectedDataFilterOptions: () => {
                            return {
                                sex: null,
                                age: null,
                                regions: null,
                                survey: null
                            }
                        },
                        regionOptions: () => {
                            return [{
                                id: "a1",
                                name: "area1",
                                options: [
                                    {id: "a2", name: "area1.1"}
                                ]
                            }]
                        }
                    }
                }
            }
        });
        const wrapper = shallowMount(ChoroplethFilters, {localVue, store});
        const vm = (wrapper as any).vm;
        const callCount = mockFilterUpdated.mock.calls.length;

        vm.selectRegion(["a2"]);

        expect(mockFilterUpdated.mock.calls[callCount][1]).toStrictEqual([FilterType.Region, [{
            id: "a2",
            name: "area1.1"
        }]]);
    });

    it("refreshSelectedChoroplethFilters leaves selected filters unchanged if they are available for new data type", () => {
        const stateAgeFilterOptions = [
            {id: "a1", name: "0-4"},
            {id: "a2", name: "5-9"}
        ];
        const stateSurveyFilterOptions = [
            {id: "s1", name: "Survey 1"},
            {id: "s2", name: "Survey 2"}
        ];
        const stateQuarterFilterOptions = [
            {id: "1", name: "Jan-Mar 2019"},
            {id: "2", name: "Apr-Jun 2019"}
        ];
        const mockSelectedFilters = {
            age: {id: "a2", name: "5-9"},
            survey: {id: "s1", name: "Survey 1"},
            sex: {id: "female", name: "female"},
            quarter: {id: "1", name: "Jan-Mar 2019"},
            regions: null
        };
        const mockFilterUpdated = jest.fn();
        const mockState = {
            selectedChoroplethFilters: mockSelectedFilters,
            selectedDataType: DataType.Survey
        };

        const mockGetters = {
            selectedDataFilterOptions: () => {
                return {
                    age: stateAgeFilterOptions,
                    survey: stateSurveyFilterOptions,
                    quarter: stateQuarterFilterOptions
                }
            }
        };
        const mockActions = {
            choroplethFilterUpdated: mockFilterUpdated
        };

        const wrapper = getWrapper(mockState, mockGetters, mockActions);
        const vm = (wrapper as any).vm;
        const callCount = mockFilterUpdated.mock.calls.length;

        vm.refreshSelectedChoroplethFilters();
        expect(mockFilterUpdated.mock.calls.length).toBe(callCount); //no more updates
    });

    it("refreshSelectedChoroplethFilters uses first available filter options when existing filters unavailable for new data type", () => {
        const stateAgeFilterOptions = [
            {id: "a1", name: "0-4"},
            {id: "a2", name: "5-9"}
        ];
        const stateQuarterFilterOptions = [
            {id: "1", name: "Jan-Mar 2019"},
            {id: "2", name: "Apr-Jun 2019"}
        ];
        const stateRegionOptions = [
            {
                id: "a1",
                name: "All",
                options: [
                    {id: "a2", name: "Region"}
                ]
            }
        ];
        const mockSelectedFilters = {
            age: {id: "a3", name: "10-15"},
            survey: {id: "s1", name: "Survey 1"},
            sex: {id: "male", name: "male"},
            quarter: {id: "3", name: "Jul-Sep 2019"},
            regions: null
        };


        const mockFilterUpdated = jest.fn();
        const wrapper = getWrapper({
                selectedChoroplethFilters: mockSelectedFilters,
                selectedDataType: DataType.ANC
            },
            {
                selectedDataFilterOptions: () => {
                    return {
                        age: stateAgeFilterOptions,
                        survey: null,
                        regions: stateRegionOptions,
                        quarter: stateQuarterFilterOptions
                    }
                }
            },
            {
                choroplethFilterUpdated: mockFilterUpdated
            });
        const vm = (wrapper as any).vm;
        const callCount = mockFilterUpdated.mock.calls.length;

        vm.refreshSelectedChoroplethFilters();
        //Sex should be left unchanged as there are no available sex options for ANC
        expect(mockFilterUpdated.mock.calls.length).toBe(callCount + 2);
        expect(mockFilterUpdated.mock.calls[callCount][1]).toStrictEqual([FilterType.Age, {id: "a1", name: "0-4"}]);
        expect(mockFilterUpdated.mock.calls[callCount+1][1]).toStrictEqual([FilterType.Quarter, {id: "1", name: "Jan-Mar 2019"}]);
    });

    const getWrapper = (state?: Partial<FilteredDataState>,
                        getters: any = stubGetters,
                        mockActions: ActionTree<FilteredDataState, RootState> = {}) => {

        const store = new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState(state),
                    getters,
                    actions: {
                        ...filterActions,
                        ...mockActions
                    },
                    mutations
                }
            }
        });
        return shallowMount(ChoroplethFilters, {localVue, store});
    };
});