import {getters, getUnfilteredData} from "../../app/store/filteredData/getters"
import {Module} from "vuex";
import {DataType, FilteredDataState, initialFilteredDataState} from "../../app/store/filteredData/filteredData";
import {RootState} from "../../app/root";
import {
    mockAncResponse,
    mockBaselineState,
    mockProgramResponse,
    mockSurveyAndProgramState,
    mockSurveyFilters,
    mockSurveyResponse,
    mockRootState,
    mockMetadataState,
    mockPlottingMetadataResponse,
    mockIndicators,
    mockFilteredDataState,
    mockModelRunState, mockModelResultResponse, mockProgramFilters
} from "../mocks";
import {NestedFilterOption} from "../../app/generated";
import {interpolateCool, interpolateWarm} from "d3-scale-chromatic";

export const testGetters = {
    colorFunctions: {
        art: function(t: number) {return `rgb(${t},0,0)`;},
        prev: function(t: number) {return `rgb(0,${t},0)`;}
    },
    flattenedSelectedRegionFilters: {},
    regionOptions: {id: "MWI", name: "Malawi"},
    choroplethRanges: {
        prev: {min: 0, max: 1},
        art: {min: 0, max: 1}
    }
};

describe("FilteredData getters", () => {

    const sexOptions = [
        {id: "both", name: "both"},
        {id: "female", name: "female"},
        {id: "male", name: "male"}
    ];

    it("gets correct selectedDataFilters when selectedDataType is Program", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.Program},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testFilters = mockProgramFilters({age: [{id: "age1", name: "0-4"}, {id: "age2", name: "5-9"}]});
        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {
                    program: mockProgramResponse(
                        {filters: testFilters}
                    )
                }),
            filteredData: testState
        });

        const filters = getters.selectedDataFilterOptions(testState, testGetters, testRootState, null) as any;
        expect(filters.age).toStrictEqual(testFilters.age);
        expect(filters.regions).toStrictEqual(testGetters.regionOptions);
        expect(filters.sex).toStrictEqual(sexOptions);
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

        const filters = getters.selectedDataFilterOptions(testState, testGetters, testRootState, null) as any;
        expect(filters.age).toStrictEqual(testFilters.age);
        expect(filters.regions).toStrictEqual(testGetters.regionOptions);
        expect(filters.sex).toStrictEqual(sexOptions);
        expect(filters.surveys).toStrictEqual(testFilters.surveys);

    });

    it("gets correct selectedDataFilters when selectedDataType is ANC", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.ANC},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testFilters = mockProgramFilters({age: [{id: "age1", name: "0-4"}, {id: "age2", name: "5-9"}]});
        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {
                    anc: mockAncResponse(
                        {filters: testFilters}
                    )
                }),
            filteredData: testState
        });

        const filters = getters.selectedDataFilterOptions(testState, testGetters, testRootState, null) as any;
        expect(filters.age).toStrictEqual(testFilters.age);
        expect(filters.regions).toStrictEqual(testGetters.regionOptions);
        expect(filters.sex).toBeUndefined();
        expect(filters.surveys).toBeUndefined();
    });

    it("gets correct selectedDataFilters when selectedDataType is Output", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.Output},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testFilters ={
            age: [{id: "age1", name: "0-4"}, {id: "age2", name: "5-9"}],
            quarter: [{id: "1", name: "2019 Q1"}],
            indicator: []};
        const testRootState = mockRootState({
            modelRun: mockModelRunState(
                {
                    result: mockModelResultResponse(
                        {filters: testFilters}
                    )
                }),
            filteredData: testState
        });

        const filters = getters.selectedDataFilterOptions(testState, testGetters, testRootState, null) as any;
        expect(filters.age).toStrictEqual(testFilters.age);
        expect(filters.regions).toStrictEqual(testGetters.regionOptions);
        expect(filters.sex).toStrictEqual(sexOptions);
        expect(filters.surveys).toBeUndefined();
    });

    it("gets null selectedDataFilters when unknown data type", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: 99 as any},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testRootState = mockRootState();

        const filters = getters.selectedDataFilterOptions(testState, testGetters, testRootState, null)!;
        expect(filters).toBeNull();
    });

    it("gets region filters from shape", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testFilters = {
            id: "MWI",
            name: "Malawi",
            options: [
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
            }]
        };

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
                        regions: testFilters
                    }
                }
            } as any),
            filteredData: testState
        });

        const filters = getters.regionOptions(testState, null, testRootState, null) as NestedFilterOption[];
        expect(filters).toStrictEqual(testFilters.options); //We skip top level and use its options as our region array

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

    it("gets unfilteredData when selectedDataType is Output", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.Output},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;

        const testRootState = mockRootState({
            modelRun: mockModelRunState(
                {result: mockModelResultResponse(
                        {data: "TEST" as any}
                    )}),
            filteredData: testState
        });

        const unfilteredData = getUnfilteredData(testState, testRootState);
        expect(unfilteredData).toStrictEqual("TEST");
    });

    it("gets unfilteredData when selectedDataType is unknown", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: 99 as DataType.Output},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;

        const testRootState = mockRootState({
            filteredData: testState
        });

        const unfilteredData = getUnfilteredData(testState, testRootState);
        expect(unfilteredData).toBeNull();
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

    it("gets choropleth ranges when selectedDataType is Output", () => {
        const testState = mockFilteredDataState({selectedDataType: DataType.Output});
        const testRootState = mockRootState({
            metadata: mockMetadataState({
                plottingMetadata: mockPlottingMetadataResponse({
                    output: {
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
        expect(result.prev!!.min).toBe(0.1);
        expect(result.prev!!.max).toBe(0.6);
    });

    it("gets null choropleth ranges when selectedDataType is unknown", () => {
        const testState = mockFilteredDataState({selectedDataType: 15 as DataType.Survey});

        const result = getters.choroplethRanges(testState, null, mockRootState(), null)!!;
        expect(result).toBeNull();
    });

    it("gets flattened selected region filter", () => {

        const testRegions = [{
            id: "R1",
            name: "Region 1",
            options: [
                {
                    id: "R2",
                    name: "Region 2"
                },
                {
                    id: "R3",
                    name: "Region 3",
                    options: [
                        {
                            id: "R4",
                            name: "Region 4"
                        }
                    ]
                }
            ]
        }];
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {
                ...initialFilteredDataState,
                selectedDataType: DataType.ANC,
                selectedChoroplethFilters: {
                    age: {id: "1", name: "0-99"},
                    survey: null,
                    sex: {id: "male", name: "male"},
                    quarter: null,
                    regions: testRegions
                }
            },
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;


        const flattenedRegionFilter = getters.flattenedSelectedRegionFilters(testState, testGetters, mockRootState(), null);

        const expected = {
            "R1": testRegions[0],
            "R2": testRegions[0].options[0],
            "R3": testRegions[0].options[1],
            "R4": testRegions[0].options[1].options!![0]
        };

        expect(flattenedRegionFilter).toStrictEqual(expected);
    });

    it("gets flattened selected region filter when region filter is null", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {
                ...initialFilteredDataState,
                selectedDataType: DataType.ANC,
                selectedChoroplethFilters: {
                    age: {id: "1", name: "0-99"},
                    survey: null,
                    sex: {id: "male", name: "male"},
                    quarter: null,
                    regions: null
                }
            },
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;

        const flattenedRegionFilter = getters.flattenedSelectedRegionFilters(testState, testGetters, mockRootState(), null);

        const expected = {};

        expect(flattenedRegionFilter).toStrictEqual(expected);
    });

    it("gets flattened region options", () => {

        const testRegions = [{
            id: "R1",
            name: "Region 1",
            options: [
                {
                    id: "R2",
                    name: "Region 2"
                },
                {
                    id: "R3",
                    name: "Region 3",
                    options: [
                        {
                            id: "R4",
                            name: "Region 4"
                        }
                    ]
                }
            ]
        }];
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {
                ...initialFilteredDataState
            }
        };
        const testState = testStore.state as FilteredDataState;
        const filterGetters = {
            ...testGetters,
            regionOptions: testRegions
        };

        const flattenedRegionOptions = getters.flattenedRegionOptions(testState, filterGetters, mockRootState(), null);

        const expected = {
            "R1": testRegions[0],
            "R2": testRegions[0].options[0],
            "R3": testRegions[0].options[1],
            "R4": testRegions[0].options[1].options!![0]
        };

        expect(flattenedRegionOptions).toStrictEqual(expected);
    });

    it("gets flattened selected region options when region filter is null", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {
                ...initialFilteredDataState
            }
        };
        const testState = testStore.state as FilteredDataState;
        const filterGetters = {
            ...testGetters,
            regionOptions: null
        };

        const flattenedRegionOptions = getters.flattenedRegionOptions(testState, filterGetters, mockRootState(), null);

        const expected = {};

        expect(flattenedRegionOptions).toStrictEqual(expected);
    });

});