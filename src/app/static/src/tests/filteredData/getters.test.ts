
import {getters, getUnfilteredData} from "../../app/store/filteredData/getters"
import {initialBaselineState} from "../../app/store/baseline/baseline";
import {Module} from "vuex";
import {DataType, FilteredDataState, initialFilteredDataState} from "../../app/store/filteredData/filteredData";
import {RootState} from "../../app/root";
import {
    mockAgeFilters,
    mockAncResponse,
    mockBaselineState,
    mockProgramResponse,
    mockSurveyAndProgramState,
    mockSurveyFilters,
    mockSurveyResponse,
    mockRootState
} from "../mocks";
import {AgeFilters, NestedFilterOption, SurveyFilters} from "../../app/generated";
import {interpolateCool, interpolateWarm} from "d3-scale-chromatic";
import {initialModelRunState} from "../../app/store/modelRun/modelRun";

describe("FilteredData mutations", () => {

    const testGetters = {
        colorFunctions: {
            art: function(t: number) {return `rgb(${t},0,0)`;},
            prev: function(t: number) {return `rgb(0,${t},0)`;}
        }
    };

    it("gets correct selectedDataFilters when selectedDataType is Program", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.Program},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testFilters = mockAgeFilters({age: [{id: "age1", name: "0-4"}, {id: "age2", name: "5-9"}]});
        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {
                    program: mockProgramResponse(
                        {filters: testFilters}
                    )
                }),
            filteredData: testState
        });

        const filters = getters.selectedDataFilterOptions(testState, null, testRootState, null) as AgeFilters;
        expect(filters.age).toStrictEqual(testFilters.age);

    });

    it("gets correct selectedDataFilters when selectedDataType is Survey", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.Survey},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testFilters = mockSurveyFilters({
            age: [{id: "age1", name: "0-4"}, {id: "age2", name: "5-9"}],
            surveys: [{id: "s1", name: "Survey 1"}, {id: "s2", name: "Survey 2"}]
        });
        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {
                    survey: mockSurveyResponse(
                        {filters: testFilters}
                    )
                }),
            filteredData: testState
        });

        const filters = getters.selectedDataFilterOptions(testState, null, testRootState, null) as SurveyFilters;
        expect(filters.age).toStrictEqual(testFilters.age);
        expect(filters.surveys).toStrictEqual(testFilters.surveys);

    });

    it("gets correct selectedDataFilters when selectedDataType is ANC", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.ANC},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testFilters = mockAgeFilters({age: [{id: "age1", name: "0-4"}, {id: "age2", name: "5-9"}]});
        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {
                    anc: mockAncResponse(
                        {filters: testFilters}
                    )
                }),
            filteredData: testState
        });

        const filters = getters.selectedDataFilterOptions(testState, null, testRootState, null) as AgeFilters;
        expect(filters.age).toStrictEqual(testFilters.age);
    });

    it("gets region filters from shape", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testFilters = [
            {
                name: "Northern Region", id: "MWI.1", options: [
                    {name: "Chitipa", id: "MWI.1.1"},
                    {name: "Karonga", id: "MWI.1.2"}
                ]
            },
            {
                name: "Central Region", id: "MWI.2", options: [
                    {name: "Dedza", id: "MWI.2.1"},
                    {name: "Dowa", id: "MWI.2.2"}
                ]
            }
        ];

        const testRootState = mockRootState({
            baseline: mockBaselineState({
                shape: {
                    filename: "test.shape",
                    type: "shape",
                    data: {
                        type: "FeatureCollection",
                        features: []
                    },
                    filters: {
                        regions: {options: testFilters} as any
                    }
                }
            }),
            filteredData: testState
        });

        const filters = getters.regionOptions(testState, null, testRootState, null) as NestedFilterOption[];
        expect(filters).toStrictEqual(testFilters);

    });

    it("gets unfilteredData when selectedDataType is Survey", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.Survey},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;

        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {survey: mockSurveyResponse(
                        {data: "TEST" as any}
                    )}),
            filteredData: testState
        });

        const unfilteredData = getUnfilteredData(testState, testRootState);
        expect(unfilteredData).toStrictEqual("TEST");
    });

    it("gets unfilteredData when selectedDataType is Program", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.Program},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;

        const testRootState = mockRootState({
           surveyAndProgram: mockSurveyAndProgramState(
                {program: mockProgramResponse(
                        {data: "TEST" as any}
                    )}),
            filteredData: testState
        });

        const unfilteredData = getUnfilteredData(testState, testRootState);
        expect(unfilteredData).toStrictEqual("TEST");
    });

    it("gets unfilteredData when selectedDataType is ANC", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.ANC},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;

        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {anc: mockAncResponse(
                        {data: "TEST" as any}
                    )}),
            filteredData: testState
        });

        const unfilteredData = getUnfilteredData(testState, testRootState);
        expect(unfilteredData).toStrictEqual("TEST");
    });

    it("gets colorFunctions", () => {
        const result = getters.colorFunctions(initialFilteredDataState, null, mockRootState(), null);
        expect(result.art(0.1)).toEqual(interpolateWarm(0.1));
        expect(result.prev(0.1)).toEqual(interpolateCool(0.1));
    });

    it("gets regionIndicators for survey", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {
                ...initialFilteredDataState,
                selectedDataType: DataType.Survey,
                selectedChoroplethFilters: {
                    age: {id: "1", name: "0-99"},
                    survey: {id: "s1", name: "Survey 1"},
                    sex: {id: "both", name: "both"},
                    updateByType: jest.fn(),
                    getByType: jest.fn()
                }
            },
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                survey_id: "s1",
                indicator: "prev",
                est: 2,
                age_group_id: "1",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area2",
                survey_id: "s1",
                indicator: "prev",
                est: 3,
                age_group_id: "1",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area3",
                survey_id: "s1",
                indicator: "artcov",
                est: 4,
                age_group_id: "1",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area2",
                survey_id: "s1",
                indicator: "artcov",
                est: 5,
                age_group_id: "1",
                sex: "both"
            }
        ];
        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {survey: mockSurveyResponse(
                        {data: testData}
                    )}),
            filteredData: testState});

        const regionIndicators = getters.regionIndicators(testState, testGetters, testRootState, null);

        const expected = {
            indicators: {
                "area1":
                    {
                        "prev": {value: 2, color: "rgb(0,2,0)"}
                    },
                "area2":
                    {
                        "prev": {value: 3, color: "rgb(0,3,0)"},
                        "art": {value: 5, color: "rgb(5,0,0)"}
                    },
                "area3": {
                    "art": {value: 4, color: "rgb(4,0,0)"}
                }
            },
            artRange: {min: 4, max: 5},
            prevRange: {min: 2, max: 3}
        };

        expect(regionIndicators).toStrictEqual(expected);
    });

    it("filters regionIndicators for survey", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {
                ...initialFilteredDataState,
                selectedDataType: DataType.Survey,
                selectedChoroplethFilters: {
                    age: {id: "1", name: "0-99"},
                    survey: {id: "s1", name: "Survey 1"},
                    sex: {id: "both", name: "both"},
                    updateByType: jest.fn(),
                    getByType: jest.fn()
                }
            },
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                survey_id: "s1",
                indicator: "prev",
                est: 2,
                age_group_id: "1",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area2",
                survey_id: "s2",
                indicator: "prev",
                est: 3,
                age_group_id: "1",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area3",
                survey_id: "s1",
                indicator: "prev",
                est: 4,
                age_group_id: "2",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area4",
                survey_id: "s1",
                indicator: "prev",
                est: 5,
                age_group_id: "1",
                sex: "female"
            },

        ];
        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {survey: mockSurveyResponse(
                        {data: testData}
                    )}),
            filteredData: testState});

        const regionIndicators = getters.regionIndicators(testState, testGetters, testRootState, null);

        const expected = {
            indicators: {
                "area1":
                    {
                        "prev": {value: 2, color: "rgb(0,2,0)"}
                    }
            },
            artRange: {min: null, max: null},
            prevRange: {min: 2, max: 2}
        };

        expect(regionIndicators).toStrictEqual(expected);
    });


    it("gets regionIndicators for programme", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {
                ...initialFilteredDataState,
                selectedDataType: DataType.Program,
                selectedChoroplethFilters: {
                    age: {id: "1", name: "0-99"},
                    survey: null,
                    sex: {id: "both", name: "both"},
                    updateByType: jest.fn(),
                    getByType: jest.fn()
                }
            },
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                current_art: 2,
                age_group_id: "1",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area2",
                current_art: 3,
                age_group_id: "1",
                sex: "both"
            }
        ];
        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {program: mockProgramResponse(
                        {data: testData}
                    )}),
            filteredData: testState});

        const regionIndicators = getters.regionIndicators(testState, testGetters, testRootState, null);

        const expected = {
            indicators: {
                "area1": {
                    "art": {value: 2, color: "rgb(2,0,0)"}
                },
                "area2": {
                    "art": {value: 3, color: "rgb(3,0,0)"}
                }
            },
            artRange: {min: 2, max: 3},
            prevRange: {min: null, max: null}
        };

        expect(regionIndicators).toStrictEqual(expected);
    });

    it("filters regionIndicators for programme", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {
                ...initialFilteredDataState,
                selectedDataType: DataType.Program,
                selectedChoroplethFilters: {
                    age: {id: "1", name: "0-99"},
                    survey: {id: "s1", name: "Survey 1"}, //Should be ignored for this data type
                    sex: {id: "both", name: "both"},
                    updateByType: jest.fn(),
                    getByType: jest.fn()
                }
            },
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                current_art: 2,
                age_group_id: "1",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area2",
                current_art: 3,
                age_group_id: "2",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area3",
                current_art: 4,
                age_group_id: "1",
                sex: "male"
            },
            {
                iso3: "MWI",
                area_id: "area4",
                current_art: 5,
            }
        ];
        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {program: mockProgramResponse(
                        {data: testData}
                    )}),
            filteredData: testState});

        const regionIndicators = getters.regionIndicators(testState, testGetters, testRootState, null);

        const expected = {
            indicators: {
                "area1": {
                    "art": {value: 2, color: "rgb(2,0,0)"}
                }
            },
            artRange: {min: 2, max: 2},
            prevRange: {min: null, max: null}
        };

        expect(regionIndicators).toStrictEqual(expected);
    });

    it("gets regionIndicators for ANC", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {
                ...initialFilteredDataState,
                selectedDataType: DataType.ANC,
                selectedChoroplethFilters: {
                    age: {id: "1", name: "0-99"},
                    survey: null,
                    sex: null,
                    updateByType: jest.fn(),
                    getByType: jest.fn()
                }
             },
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                ancrt_test_pos: 2,
                age_group_id: "1"
            },
            {
                iso3: "MWI",
                area_id: "area2",
                ancrt_test_pos: 3,
                age_group_id: "1"
            }
        ];
        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {anc: mockAncResponse(
                        {data: testData}
                    )}),
            filteredData: testState});

        const regionIndicators = getters.regionIndicators(testState, testGetters, testRootState, null);

        const expected = {
            indicators: {
                "area1": {
                    "prev": {value: 2, color: "rgb(0,2,0)"}
                },
                "area2": {
                    "prev": {value: 3, color: "rgb(0,3,0)"}
                }
            },
            artRange: {min: null, max: null},
            prevRange: {min: 2, max: 3}
        };

        expect(regionIndicators).toStrictEqual(expected);
    });

    it("filters regionIndicators for ANC", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {
                ...initialFilteredDataState,
                selectedDataType: DataType.ANC,
                selectedChoroplethFilters: {
                    age: {id: "1", name: "0-99"},
                    survey: null,
                    sex: {id: "male", name: "male"}, //should be ignored
                    updateByType: jest.fn(),
                    getByType: jest.fn()
                }
            },
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                ancrt_test_pos: 2,
                age_group_id: "1"
            },
            {
                iso3: "MWI",
                area_id: "area2",
                ancrt_test_pos: 3,
                age_group_id: "1"
            },
            {
                iso3: "MWI",
                area_id: "area3",
                ancrt_test_pos: 2,
                age_group_id: "2"
            }
        ];
        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {anc: mockAncResponse(
                        {data: testData}
                    )}),
            filteredData: testState});

        const regionIndicators = getters.regionIndicators(testState, testGetters, testRootState, null);

        const expected = {
            indicators: {
                "area1": {
                    "prev": {value: 2, color: "rgb(0,2,0)"}
                },
                "area2": {
                    "prev": {value: 3, color: "rgb(0,3,0)"}
                }
            },
            artRange: {min: null, max: null},
            prevRange: {min: 2, max: 3}
        };

        expect(regionIndicators).toStrictEqual(expected);
    });


});