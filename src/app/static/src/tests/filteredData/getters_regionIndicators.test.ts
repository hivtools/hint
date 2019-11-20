import {getters} from "../../app/store/filteredData/getters"
import {Module} from "vuex";
import {DataType, FilteredDataState, initialFilteredDataState} from "../../app/store/filteredData/filteredData";
import {RootState} from "../../app/root";
import {
    mockAncResponse,
    mockBaselineState, mockFilteredDataState,
    mockModelResultResponse,
    mockModelRunState,
    mockProgramResponse,
    mockRootState,
    mockSurveyAndProgramState,
    mockSurveyResponse
} from "../mocks";
import {testGetters} from "./getters.test";
import {interpolateGreys} from "d3-scale-chromatic";

describe("FilteredData regionIndicator getter", () => {

    const testRootGetters = (testIndicatorsMetadata: any) => {
        return {
            "metadata/choroplethIndicatorsMetadata": testIndicatorsMetadata
        }
    };

    function testIndicatorMetadata(indicator: string, value_column: string, indicator_column: string, indicator_value: string) {
        return {
            indicator: indicator,
            value_column: value_column,
            indicator_column: indicator_column,
            indicator_value: indicator_value,
            colour: "interpolateGreys",
            invert_scale: false,
            min: 0,
            max: 1
        };
    }

    const testAncIndicatorsMetadata = [
        testIndicatorMetadata("art_coverage", "art_coverage", "", ""),
        testIndicatorMetadata("prevalence", "prevalence", "", "")
    ];

    const testSurveyIndicatorsMetadata = [
        testIndicatorMetadata("art_coverage", "est", "indicator", "artcov"),
        testIndicatorMetadata("prevalence", "est", "indicator", "prev")
    ];

    const testProgrammeIndicatorsMetadata = [
        testIndicatorMetadata("current_art", "current_art", "", "")
    ];

    const testOutputIndicatorsMetadata = [
        testIndicatorMetadata("prevalence", "mean", "indicator_id", "2")
    ];

    it("gets regionIndicators for survey", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: mockFilteredDataState({
                selectedDataType: DataType.Survey,
                selectedChoroplethFilters: {
                    age: "1",
                    survey: "s1",
                    sex: "both",
                    quarter: "1",
                    regions: []
                }
            }),
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                survey_id: "s1",
                indicator: "prev",
                est: 0.2,
                age_group_id: "1",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area2",
                survey_id: "s1",
                indicator: "prev",
                est: 0.3,
                age_group_id: "1",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area3",
                survey_id: "s1",
                indicator: "artcov",
                est: 0.4,
                age_group_id: "1",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area2",
                survey_id: "s1",
                indicator: "artcov",
                est: 0.5,
                age_group_id: "1",
                sex: "both"
            }
        ];
        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {
                    survey: mockSurveyResponse(
                        {data: testData}
                    )
                }),
            baseline: mockBaselineState({
                flattenedRegionFilters: {}
            }),
            filteredData: testState
        });

        const mockGetters = testGetters(testState);
        const regionIndicators = getters.regionIndicators(testState, mockGetters, testRootState,
            testRootGetters(testSurveyIndicatorsMetadata));

        const expected = {

            "area1":
                {
                    "prevalence": {value: 0.2, color: interpolateGreys(0.2)}
                },
            "area2":
                {
                    "prevalence": {value: 0.3, color: interpolateGreys(0.3)},
                    "art_coverage": {value: 0.5, color: interpolateGreys(0.5)}
                },
            "area3": {
                "art_coverage": {value: 0.4, color: interpolateGreys(0.4)}

            }
        };

        expect(regionIndicators).toStrictEqual(expected);
    });

    it("filters regionIndicators for survey", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: mockFilteredDataState({
                selectedDataType: DataType.Survey,
                selectedChoroplethFilters: {
                    age: "1",
                    survey: "s1",
                    sex: "both",
                    quarter: "1", //should be ignored
                    regions: []
                }
            }),
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                survey_id: "s1",
                indicator: "prev",
                est: 0.2,
                age_group_id: "1",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area2",
                survey_id: "s2",
                indicator: "prev",
                est: 0.3,
                age_group_id: "1",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area3",
                survey_id: "s1",
                indicator: "prev",
                est: 0.4,
                age_group_id: "2",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area4",
                survey_id: "s1",
                indicator: "prev",
                est: 0.5,
                age_group_id: "1",
                sex: "female"
            },

        ];
        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {
                    survey: mockSurveyResponse(
                        {data: testData}
                    )
                }),
            baseline: mockBaselineState({
                flattenedRegionFilters: {}
            }),
            filteredData: testState
        });

        const regionIndicators = getters.regionIndicators(testState, testGetters(testState), testRootState,
            testRootGetters(testSurveyIndicatorsMetadata));

        const expected = {
            "area1":
                {
                    "prevalence": {value: 0.2, color: interpolateGreys(0.2)}
                }
        };

        expect(regionIndicators).toStrictEqual(expected);
    });


    it("gets regionIndicators for programme", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: mockFilteredDataState({
                selectedDataType: DataType.Program,
                selectedChoroplethFilters: {
                    age: "1",
                    survey: "",
                    sex: "both",
                    quarter: "1",
                    regions: []
                }
            }),
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                current_art: 0.2,
                age_group_id: "1",
                quarter_id: 1,
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area2",
                current_art: 0.3,
                age_group_id: "1",
                quarter_id: 1,
                sex: "both"
            }
        ];
        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {
                    program: mockProgramResponse(
                        {data: testData}
                    )
                }),
            baseline: mockBaselineState({
                flattenedRegionFilters: {}
            }),
            filteredData: testState
        });

        const regionIndicators = getters.regionIndicators(testState, testGetters(testState), testRootState,
            testRootGetters(testProgrammeIndicatorsMetadata));

        const expected = {
            "area1": {
                "current_art": {value: 0.2, color: interpolateGreys(0.2)}
            },
            "area2": {
                "current_art": {value: 0.3, color: interpolateGreys(0.3)}
            }
        };

        expect(regionIndicators).toStrictEqual(expected);
    });

    it("filters regionIndicators for programme", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: mockFilteredDataState({
                selectedDataType: DataType.Program,
                selectedChoroplethFilters: {
                    age: "1",
                    survey: "s1", //Should be ignored for this data type
                    sex: "both",
                    quarter: "1",
                    regions: []
                }
            }),
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                current_art: 0.2,
                age_group_id: "1",
                quarter_id: 1,
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area2",
                current_art: 0.3,
                age_group_id: "2",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area3",
                current_art: 0.4,
                age_group_id: "1",
                sex: "male"
            },
            {
                iso3: "MWI",
                area_id: "area4",
                current_art: 0.5,
            },
            {
                iso3: "MWI",
                area_id: "area5",
                current_art: 0.6,
                age_group_id: "1",
                quarter_id: 2,
                sex: "both"
            },
        ];
        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {
                    program: mockProgramResponse(
                        {data: testData}
                    )
                }),
            baseline: mockBaselineState({
                flattenedRegionFilters: {}
            }),
            filteredData: testState
        });

        const regionIndicators = getters.regionIndicators(testState, testGetters(testState), testRootState,
            testRootGetters(testProgrammeIndicatorsMetadata));

        const expected = {
            "area1": {
                "current_art": {value: 0.2, color: interpolateGreys(0.2)}
            }
        };

        expect(regionIndicators).toStrictEqual(expected);
    });

    it("gets regionIndicators for ANC", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: mockFilteredDataState({
                selectedDataType: DataType.ANC,
                selectedChoroplethFilters: {
                    age: "1",
                    survey: "",
                    sex: "",
                    quarter: "1",
                    regions: []
                }
            }),
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                art_coverage: 0,
                prevalence: 0.2,

                age_group_id: 1,
                quarter_id: 1
            },
            {
                iso3: "MWI",
                area_id: "area2",
                art_coverage: 0.4,
                prevalence: 0.3,
                age_group_id: 1,
                quarter_id: 1
            }
        ];
        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {
                    anc: mockAncResponse(
                        {data: testData}
                    )
                }),
            baseline: mockBaselineState({
                flattenedRegionFilters: {}
            }),
            filteredData: testState
        });

        const regionIndicators = getters.regionIndicators(testState, testGetters(testState), testRootState,
            testRootGetters(testAncIndicatorsMetadata));

        const expected = {

            "area1": {
                "art_coverage": {value: 0, color: interpolateGreys(0)},
                "prevalence": {value: 0.2, color: interpolateGreys(0.2)}
            },
            "area2": {
                "art_coverage": {value: 0.4, color: interpolateGreys(0.4)},
                "prevalence": {value: 0.3, color: interpolateGreys(0.3)}
            }
        };

        expect(regionIndicators).toStrictEqual(expected);
    });

    it("filter regionIndicators for ANC", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: mockFilteredDataState({
                selectedDataType: DataType.ANC,
                selectedChoroplethFilters: {
                    age: "1", //should be ignored
                    survey: "",
                    sex: "male", //should be ignored
                    quarter: "1",
                    regions: []
                }
            }),
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                prevalence: 0.2,
                art_coverage: 0,
                age_group_id: 1,
                quarter_id: 1
            },
            {
                iso3: "MWI",
                area_id: "area2",
                prevalence: 0.3,
                art_coverage: 0.4,
                age_group_id: 1,
                quarter_id: 1
            },
            {
                iso3: "MWI",
                area_id: "area3",
                prevalence: 0.4,
                age_group_id: 2,
                quarter_id: 1
            },
            {
                iso3: "MWI",
                area_id: "area4",
                prevalence: 0.4,
                art_coverage: 0.6,
                age_group_id: 1,
                quarter_id: 2
            }
        ];
        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {
                    anc: mockAncResponse(
                        {data: testData}
                    )
                }),
            baseline: mockBaselineState({
                flattenedRegionFilters: {}
            }),
            filteredData: testState
        });

        const regionIndicators = getters.regionIndicators(testState, testGetters(testState), testRootState,
            testRootGetters(testAncIndicatorsMetadata));
        const expected = {
            "area1": {
                "art_coverage": {value: 0, color: interpolateGreys(0)},
                "prevalence": {value: 0.2, color: interpolateGreys(0.2)}
            },
            "area2": {
                "art_coverage": {value: 0.4, color: interpolateGreys(0.4)},
                "prevalence": {value: 0.3, color: interpolateGreys(0.3)}
            },
            "area3": {
                "prevalence": {value: 0.4, color: interpolateGreys(0.4)} //No art value in this row
            }
        };

        expect(regionIndicators).toStrictEqual(expected);
    });

    it("gets regionIndicators for Output", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: mockFilteredDataState({
                ...initialFilteredDataState,
                selectedDataType: DataType.Output,
                selectedChoroplethFilters: {
                    age: "1",
                    survey: "",
                    sex: "both",
                    quarter: "1",
                    regions: []
                }
            }),
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                mean: 0.2,
                age_group_id: 1,
                indicator_id: 2,
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area2",
                mean: 0.3,
                age_group_id: 1,
                indicator_id: 2,
                sex: "both"
            }
        ];
        const testRootState = mockRootState({
            modelRun: mockModelRunState(
                {
                    result: mockModelResultResponse(
                        {data: testData as any}
                    )
                }),
            baseline: mockBaselineState({
                flattenedRegionFilters: {}
            }),
            filteredData: testState
        });

        const regionIndicators = getters.regionIndicators(testState, testGetters(testState), testRootState,
            testRootGetters(testOutputIndicatorsMetadata));

        const expected = {
            "area1": {
                "prevalence": {value: 0.2, color: interpolateGreys(0.2)}
            },
            "area2": {
                "prevalence": {value: 0.3, color: interpolateGreys(0.3)}
            }
        };

        expect(regionIndicators).toStrictEqual(expected);
    });

    it("filters regionIndicators for Output", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: mockFilteredDataState({
                ...initialFilteredDataState,
                selectedDataType: DataType.Output,
                selectedChoroplethFilters: {
                    age: "1",
                    survey: "",
                    sex: "both",
                    quarter: "1",
                    regions: []
                }
            }),
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                mean: 0.2,
                age_group_id: 1,
                indicator_id: "2",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area2",
                mean: 0.3,
                age_group_id: 1,
                indicator_id: "2",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area3",
                mean: 0.4,
                age_group_id: 1,
                indicator_id: "2",
                sex: "male"
            },
            {
                iso3: "MWI",
                area_id: "area4",
                mean: 0.5,
                age_group_id: 2,
                indicator_id: "2",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area5",
                mean: 0.6,
                age_group_id: 1,
                indicator_id: "3",
                sex: "both"
            }
        ];
        const testRootState = mockRootState({
            modelRun: mockModelRunState(
                {
                    result: mockModelResultResponse(
                        {data: testData as any}
                    )
                }),
            baseline: mockBaselineState({
                flattenedRegionFilters: {}
            }),
            filteredData: testState
        });

        const regionIndicators = getters.regionIndicators(testState, testGetters(testState), testRootState,
            testRootGetters(testOutputIndicatorsMetadata));

        const expected = {
            "area1": {
                "prevalence": {value: 0.2, color: interpolateGreys(0.2)}
            },
            "area2": {
                "prevalence": {value: 0.3, color: interpolateGreys(0.3)}
            }
        };

        expect(regionIndicators).toStrictEqual(expected);
    });

    it("filters regionIndicators by region", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: mockFilteredDataState({
                selectedDataType: DataType.Survey,
                selectedChoroplethFilters: {
                    age: "1",
                    survey: "s1",
                    sex: "both",
                    quarter: "1",
                    regions: ["area1"]
                }
            })
        };
        const testState = testStore.state as FilteredDataState;
        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                survey_id: "s1",
                indicator: "prev",
                est: 0.2,
                age_group_id: "1",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area2",
                survey_id: "s1",
                indicator: "prev",
                est: 0.3,
                age_group_id: "1",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area3",
                survey_id: "s1",
                indicator: "prev",
                est: 0.4,
                age_group_id: "1",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area4",
                survey_id: "s1",
                indicator: "prev",
                est: 0.5,
                age_group_id: "1",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area1",
                survey_id: "s1",
                indicator: "prev",
                est: 0.6,
                age_group_id: "1",
                sex: "male"
            }

        ];
        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {
                    survey: mockSurveyResponse(
                        {data: testData}
                    )
                }),
            baseline: mockBaselineState({
                flattenedRegionFilters: {
                    "area1": {
                        id: "area1",
                        label: "Area 1",
                        children: [{
                            id: "area2", label: "Area 2", children: []
                        }]
                    },
                    "area2": {
                        id: "area2", label: "Area 2", children: []
                    }
                }
            }),
            filteredData: testState
        });

        const testRegionGetters = testGetters(testState, testRootState);

        const regionIndicators = getters.regionIndicators(testState, testRegionGetters, testRootState,
            testRootGetters(testSurveyIndicatorsMetadata));
        const expected = {
            "area1":
                {
                    "prevalence": {value: 0.2, color: interpolateGreys(0.2)}
                },
            "area2":
                {
                    "prevalence": {value: 0.3, color: interpolateGreys(0.3)}
                }
        };

        expect(regionIndicators).toStrictEqual(expected);
    });

    it("gets empty regionIndicators if no data", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: mockFilteredDataState({
                selectedDataType: DataType.Survey,
                selectedChoroplethFilters: {
                    age: "1",
                    survey: "",
                    sex: "",
                    quarter: "",
                    regions: []
                }
            }),
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {
                    survey: mockSurveyResponse(
                        {data: undefined}
                    )
                }),
            filteredData: testState
        });

        const regionIndicators = getters.regionIndicators(testState, testGetters(testState), testRootState, null);

        expect(regionIndicators).toStrictEqual({});
    });

    it("gets empty regionIndicators if no selected daa type", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: mockFilteredDataState({
                ...initialFilteredDataState,
                selectedDataType: null,
                selectedChoroplethFilters: {
                    age: "1",
                    survey: "",
                    sex: "",
                    quarter: "",
                    regions: []
                }
            }),
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
            }
        ];
        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {
                    survey: mockSurveyResponse(
                        {data: testData}
                    )
                }),
            baseline: mockBaselineState({
                flattenedRegionFilters: {}
            }),
            filteredData: testState
        });

        const regionIndicators = getters.regionIndicators(testState, testGetters(testState), testRootState, null);

        expect(regionIndicators).toStrictEqual({});
    });
});