
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
    mockRootState, mockMetadataState, mockPlottingMetadataResponse, mockIndicators, mockFilteredDataState
} from "../mocks";
import {AgeFilters, NestedFilterOption, SurveyFilters} from "../../app/generated";
import {interpolateCool, interpolateWarm} from "d3-scale-chromatic";
import {initialModelRunState} from "../../app/store/modelRun/modelRun";
import {metadata} from "../../app/store/metadata/metadata";

describe("FilteredData mutations", () => {

    const testGetters = {
        colorFunctions: {
            art: function(t: number) {return `rgb(${t},0,0)`;},
            prev: function(t: number) {return `rgb(0,${t},0)`;}
        },
        choroplethRanges: {
            prev: {min: 0, max: 1},
            art: {min: 0, max: 1}
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

    it("gets choropleth ranges when selectedDataType is ANC", () => {
        const testState = mockFilteredDataState({selectedDataType: DataType.ANC});
        const testRootState = mockRootState({
            metadata: mockMetadataState({
                plottingMetadata: mockPlottingMetadataResponse({
                    anc: {
                        choropleth: {
                            indicators: {
                                prevalence: mockIndicators({min: 0.01, max: 0.5})
                            }
                        }
                    }
                })
            })
        });

        const result = getters.choroplethRanges(testState, null, testRootState, null)!!;
        expect(result.prev!!.min).toBe(0.01);
        expect(result.prev!!.max).toBe(0.5);
        expect(result.art).toBe(undefined);
    });

    it("gets choropleth ranges when selectedDataType is Program", () => {
        const testState = mockFilteredDataState({selectedDataType: DataType.Program});
        const testRootState = mockRootState({
            metadata: mockMetadataState({
                plottingMetadata: mockPlottingMetadataResponse({
                    programme: {
                        choropleth: {
                            indicators: {
                                current_art: mockIndicators({min: 0, max: 1})
                            }
                        }
                    }
                })
            })
        });

        const result = getters.choroplethRanges(testState, null, testRootState, null)!!;
        expect(result.art!!.min).toBe(0);
        expect(result.art!!.max).toBe(1);
        expect(result.prev).toBe(undefined);
    });

    it("gets choropleth ranges when selectedDataType is Survey", () => {
        const testState = mockFilteredDataState({selectedDataType: DataType.Survey});
        const testRootState = mockRootState({
            metadata: mockMetadataState({
                plottingMetadata: mockPlottingMetadataResponse({
                    survey: {
                        choropleth: {
                            indicators: {
                                art_coverage: mockIndicators({min: 0, max: 1}),
                                prevalence: mockIndicators({min: 0.1, max: 0.6})
                            }
                        }
                    }
                })
            })
        });

        const result = getters.choroplethRanges(testState, null, testRootState, null)!!;
        expect(result.art!!.min).toBe(0);
        expect(result.art!!.max).toBe(1);
        expect(result.prev!!.min).toBe(0.1);
        expect(result.prev!!.max).toBe(0.6);
    });

    it("gets null choropleth ranges when selectedDataType is unkno2n", () => {
        const testState = mockFilteredDataState({selectedDataType: 15 as DataType.Survey});

        const result = getters.choroplethRanges(testState, null, mockRootState(), null)!!;
        expect(result).toBeNull();
    });

    it("gets regionIndicators for survey", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {
                ...initialFilteredDataState,
                selectedDataType: DataType.Survey,
                selectedChoroplethFilters: {
                    age: {id: "1", name: "0-99"},
                    survey: {id: "s1", name: "Survey 1"},
                    sex: {id: "both", name: "both"}
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
                    sex: {id: "both", name: "both"}
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
            filteredData: testState
        });

        const regionIndicators = getters.regionIndicators(testState, testGetters, testRootState, null);

        const expected = {
                "area1":
                    {
                        "prev": {value: 2, color: "rgb(0,2,0)"}
                    }
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
                    sex: {id: "both", name: "both"}
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
            "area1": {
                "art": {value: 2, color: "rgb(2,0,0)"}
            },
            "area2": {
                "art": {value: 3, color: "rgb(3,0,0)"}
            }
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
                    sex: {id: "both", name: "both"}
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
            "area1": {
                "art": {value: 2, color: "rgb(2,0,0)"}
            }
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
                    sex: null
                }
             },
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                prevalence: 2,
                age_group_id: 1
            },
            {
                iso3: "MWI",
                area_id: "area2",
                prevalence: 3,
                age_group_id: 1
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
            "area1": {
                "prev": {value: 2, color: "rgb(0,2,0)"}
            },
            "area2": {
                "prev": {value: 3, color: "rgb(0,3,0)"}
            }
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
                    sex: {id: "male", name: "male"} //should be ignored
                }
            },
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                prevalence: 2,
                age_group_id: 1
            },
            {
                iso3: "MWI",
                area_id: "area2",
                prevalence: 3,
                age_group_id: 1
            },
            {
                iso3: "MWI",
                area_id: "area3",
                prevalence: 2,
                age_group_id: 2
            }
        ];
        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {anc: mockAncResponse(
                        {data: testData}
                    )}),
            filteredData: testState
        });

        const regionIndicators = getters.regionIndicators(testState, testGetters, testRootState, null);

        const expected = {
            "area1": {
                "prev": {value: 2, color: "rgb(0,2,0)"}
            },
            "area2": {
                "prev": {value: 3, color: "rgb(0,3,0)"}
            }
        };

        expect(regionIndicators).toStrictEqual(expected);
    });


});