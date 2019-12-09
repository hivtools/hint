import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vuex, {ActionTree} from 'vuex';
import ChoroplethFilters from "../../../app/components/plots/ChoroplethFilters.vue";
import {
    DataType,
    FilteredDataState,
    FilterType,
    initialSelectedChoroplethFilters
} from "../../../app/store/filteredData/filteredData";
import {mockFilteredDataState} from "../../mocks";
import {getters} from "../../../app/store/filteredData/getters";
import {actions as filterActions} from "../../../app/store/filteredData/actions";
import {RootState} from "../../../app/root";
import {mutations} from "../../../app/store/filteredData/mutations";

const localVue = createLocalVue();

describe("ChoroplethFilters component", () => {

    const stubGetters = {
        selectedDataFilterOptions: () => {
            return {};
        }
    };

    it("computes sexFilters", () => {
        const stateSexFilterOptions = [
            {id: "s1", label: "female"},
            {id: "s2", label: "male"}
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
            {id: "a1", label: "0-4"},
            {id: "a2", label: "5-9"}
        ];
        const mockSelectedFilters = {
            ...initialSelectedChoroplethFilters(),
            age: "a1"
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
            ...initialSelectedChoroplethFilters(),
            sex: "both"
        };

        const wrapper = getWrapper({selectedChoroplethFilters: mockSelectedFilters});
        const vm = (wrapper as any).vm;
        const sexFilters = vm.sexFilters;
        expect(sexFilters.selected).toStrictEqual("both");
    });

    it("computes surveyFilters", () => {
        const stateSurveyFilterOptions = [
            {id: "s1", label: "survey 1"},
            {id: "s2", label: "survey 2"}
        ];
        const mockSelectedFilters = {
            ...initialSelectedChoroplethFilters(),
            survey: "s1"
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

    it("computes yearFilters", () => {
        const stateYearFilterOptions = [
            {id: "1", label: "2018"},
            {id: "2", label: "2019"}
        ];
        const mockSelectedFilters = {
            ...initialSelectedChoroplethFilters(),
            year: "1"
        };

        const mockState = {selectedChoroplethFilters: mockSelectedFilters};
        const mockGetters = {
            selectedDataFilterOptions: () => {
                return {
                    year: stateYearFilterOptions
                }
            }
        };

        const wrapper = getWrapper(mockState, mockGetters);
        const vm = (wrapper as any).vm;
        const yearFilters = vm.yearFilters;
        expect(yearFilters.available).toStrictEqual(stateYearFilterOptions);
        expect(yearFilters.selected).toStrictEqual("1");
    });

    it("computes quarterFilters", () => {
        const stateQuarterFilterOptions = [
            {id: "1", label: "Jan-Mar 2019"},
            {id: "2", label: "Apr-Jun 2019"}
        ];
        const mockSelectedFilters = {
            ...initialSelectedChoroplethFilters(),
            quarter: "1"
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
                label: "region",
                children: [
                    {id: "a2", label: "sub-region"}
                ]
            }];
        const mockSelectedFilters = {
            ...initialSelectedChoroplethFilters(),
            regions: ["a2"]
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
                    sex: [{id: "female", label: "female"}, {id: "male", label: "male"}]
                };
            }
        };

        const wrapper = getWrapper({}, mockGetters, mockActions);
        const vm = (wrapper as any).vm;

        const callCount = mockFilterUpdated.mock.calls.length;

        const newFilter = "female";
        vm.selectSex(newFilter);

        expect(mockFilterUpdated.mock.calls[callCount][1]).toStrictEqual([FilterType.Sex, "female"]);
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
                        {id: "s1", label: "survey 1"},
                        {id: "s2", label: "survey 2"}
                    ]
                }
            }
        };

        const wrapper = getWrapper({}, mockGetters, mockActions);
        const vm = (wrapper as any).vm;

        const callCount = mockFilterUpdated.mock.calls.length;
        const newFilter = "s1";
        vm.selectSurvey(newFilter);

        expect(mockFilterUpdated.mock.calls[callCount][1]).toStrictEqual([FilterType.Survey, "s1"]);
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
                        {id: "a1", label: "0-4"},
                        {id: "a2", label: "5-9"}
                    ]
                }
            }
        };

        const wrapper = getWrapper({}, mockGetters, mockActions);
        const vm = (wrapper as any).vm;
        const callCount = mockFilterUpdated.mock.calls.length;

        const newFilter = "a2";
        vm.selectAge(newFilter);

        expect(mockFilterUpdated.mock.calls[callCount][1]).toStrictEqual([FilterType.Age, "a2"]);
    });

    it("invokes store actions when year filter is edited", () => {
        const mockFilterUpdated = jest.fn();
        const mockActions = {
            choroplethFilterUpdated: mockFilterUpdated
        };
        const mockGetters = {
            selectedDataFilterOptions: () => {
                return {
                    year: [
                        {id: "1", label: "2018"},
                        {id: "2", label: "2019"}
                    ]
                }
            }
        };

        const wrapper = getWrapper({}, mockGetters, mockActions);
        const vm = (wrapper as any).vm;
        const callCount = mockFilterUpdated.mock.calls.length;

        const newFilter = "2";
        vm.selectYear(newFilter);

        expect(mockFilterUpdated.mock.calls[callCount][1])
            .toStrictEqual([FilterType.Year, "2"]);
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
                        {id: "1", label: "Jan-Mar 2019"},
                        {id: "2", label: "Apr-Jun 2019"}
                    ]
                }
            }
        };

        const wrapper = getWrapper({}, mockGetters, mockActions);
        const vm = (wrapper as any).vm;
        const callCount = mockFilterUpdated.mock.calls.length;

        const newFilter = "2";
        vm.selectQuarter(newFilter);

        expect(mockFilterUpdated.mock.calls[callCount][1])
            .toStrictEqual([FilterType.Quarter, "2"]);
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
                                label: "area1",
                                children: [
                                    {id: "a2", label: "area1.1"}
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

        expect(mockFilterUpdated.mock.calls[callCount][1]).toStrictEqual([FilterType.Region, ["a2"]]);
    });

    it("refreshSelectedChoroplethFilters leaves selected filters unchanged if they are available for new data type", () => {
        const stateAgeFilterOptions = [
            {id: "a1", label: "0-4"},
            {id: "a2", label: "5-9"}
        ];
        const stateSurveyFilterOptions = [
            {id: "s1", label: "Survey 1"},
            {id: "s2", label: "Survey 2"}
        ];
        const stateYearFilterOptions = [
            {id: "1", label: "Jan-Mar 2019"},
            {id: "2", label: "Apr-Jun 2019"}
        ];
        const stateQuarterFilterOptions = [
            {id: "1", label: "2018"},
            {id: "2", label: "2019"}
        ];

        const mockSelectedFilters = {
            age: "a2",
            survey: "s1",
            sex: "female",
            year: "1",
            regions: [],
            quarter: "1"
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
                    year: stateYearFilterOptions,
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
            {id: "a1", label: "0-4"},
            {id: "a2", label: "5-9"}
        ];
        const stateYearFilterOptions = [
            {id: "1", label: "Jan-Mar 2019"},
            {id: "2", label: "Apr-Jun 2019"}
        ];
        const stateQuarterFilterOptions = [
            {id: "1", label: "2018"},
            {id: "2", label: "2019"}
        ];
        const stateRegionOptions = [
            {
                id: "a1",
                label: "All",
                options: [
                    {id: "a2", label: "Region"}
                ]
            }
        ];
        const mockSelectedFilters = {
            age: "a3",
            survey: "s1",
            sex: "male",
            year: "3",
            quarter: "3",
            regions: []
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
                        year: stateYearFilterOptions,
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
        expect(mockFilterUpdated.mock.calls.length).toBe(callCount + 3);
        expect(mockFilterUpdated.mock.calls[callCount][1])
            .toStrictEqual([FilterType.Age, "a1"]);
        expect(mockFilterUpdated.mock.calls[callCount + 1][1])
            .toStrictEqual([FilterType.Year, "1"]);
        expect(mockFilterUpdated.mock.calls[callCount + 2][1])
            .toStrictEqual([FilterType.Quarter, "1"]);
    });

    it("renders filters in correct order for input data types", () => {
        const wrapper = getWrapper({selectedDataType: DataType.Survey});
        const filters = wrapper.findAll("filter-select-stub");
        expect(filters.length).toBe(5);
        expect(filters.at(0).attributes("label")).toBe("Area");
        expect(filters.at(1).attributes("label")).toBe("Year");
        expect(filters.at(2).attributes("label")).toBe("Sex");
        expect(filters.at(3).attributes("label")).toBe("Age");
        expect(filters.at(4).attributes("label")).toBe("Survey");
    });

    it("renders filters in correct order for output data type", () => {
        const wrapper = getWrapper({selectedDataType: DataType.Output});
        const filters = wrapper.findAll("filter-select-stub");
        expect(filters.length).toBe(4);
        expect(filters.at(0).attributes("label")).toBe("Area");
        expect(filters.at(1).attributes("label")).toBe("Period");
        expect(filters.at(2).attributes("label")).toBe("Sex");
        expect(filters.at(3).attributes("label")).toBe("Age");
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