import {getters} from "../../app/store/filteredData/getters"
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
    mockModelRunState, mockModelResultResponse, mockProgramFilters
} from "../mocks";
import {flattenOptions, getUnfilteredData} from "../../app/store/filteredData/utils";
import {NestedFilterOption} from "../../app/generated";

export function testGetters(state: FilteredDataState, regionFilters: any = {}) {
    const self = {
        colorFunctions: {
            art: function (t: number) {
                return `rgb(${t},0,0)`;
            },
            prev: function (t: number) {
                return `rgb(0,${t},0)`;
            }
        },
        flattenedSelectedRegionFilters: regionFilters,
        regionOptions: {id: "MWI", label: "Malawi"},
        choroplethRanges: {
            prev: {min: 0, max: 1},
            art: {min: 0, max: 1}
        }
    } as any;

    self.excludeRow = getters.excludeRow(state, self);
    return self;
}

describe("FilteredData getters", () => {

    const sexOptions = [
        {id: "both", label: "both"},
        {id: "female", label: "female"},
        {id: "male", label: "male"}
    ];

    it("gets correct selectedDataFilters when selectedDataType is Program", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.Program},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testFilters = mockProgramFilters({age: [{id: "age1", label: "0-4"}, {id: "age2", label: "5-9"}]});
        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {
                    program: mockProgramResponse(
                        {filters: testFilters}
                    )
                }),
            filteredData: testState
        });

        const mockGetters = testGetters(testState);
        const filters = getters.selectedDataFilterOptions(testState, mockGetters, testRootState)!!;
        expect(filters.age).toStrictEqual(testFilters.age);
        expect(filters.regions).toStrictEqual(mockGetters.regionOptions);
        expect(filters.sex).toStrictEqual(sexOptions);
    });

    it("gets correct selectedDataFilters when selectedDataType is Survey", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.Survey},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testFilters = mockSurveyFilters({
            age: [{id: "age1", label: "0-4"}, {id: "age2", label: "5-9"}],
            surveys: [{id: "s1", label: "Survey 1"}, {id: "s2", label: "Survey 2"}]
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

        const mockGetters = testGetters(testState);
        const filters = getters.selectedDataFilterOptions(testState, mockGetters, testRootState)!!;
        expect(filters.age).toStrictEqual(testFilters.age);
        expect(filters.regions).toStrictEqual(mockGetters.regionOptions);
        expect(filters.sex).toStrictEqual(sexOptions);
        expect(filters.surveys).toStrictEqual(testFilters.surveys);

    });

    it("gets correct selectedDataFilters when selectedDataType is ANC", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.ANC},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testFilters = mockProgramFilters({age: [{id: "age1", label: "0-4"}, {id: "age2", label: "5-9"}]});
        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {
                    anc: mockAncResponse(
                        {filters: testFilters}
                    )
                }),
            filteredData: testState
        });

        const mockGetters = testGetters(testState);
        const filters = getters.selectedDataFilterOptions(testState, mockGetters, testRootState)!!;
        expect(filters.age).toStrictEqual(testFilters.age);
        expect(filters.regions).toStrictEqual(mockGetters.regionOptions);
        expect(filters.sex).toBeUndefined();
        expect(filters.surveys).toBeUndefined();
    });

    it("gets correct selectedDataFilters when selectedDataType is Output", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.Output},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testFilters = {
            age: [{id: "age1", label: "0-4"}, {id: "age2", label: "5-9"}],
            quarter: [{id: "1", label: "2019 Q1"}],
            indicators: []
        };
        const testRootState = mockRootState({
            modelRun: mockModelRunState(
                {
                    result: mockModelResultResponse(
                        {filters: testFilters}
                    )
                }),
            filteredData: testState
        });

        const mockGetters = testGetters(testState);
        const filters = getters.selectedDataFilterOptions(testState, mockGetters, testRootState)!!;
        expect(filters.age).toStrictEqual(testFilters.age);
        expect(filters.regions).toStrictEqual(mockGetters.regionOptions);
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

        const filters = getters.selectedDataFilterOptions(testState, testGetters, testRootState)!;
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
            label: "Malawi",
            children: [
                {
                    label: "Northern Region", id: "MWI.1", children: [
                        {label: "Chitipa", id: "MWI.1.1"},
                        {label: "Karonga", id: "MWI.1.2"}
                    ]
                },
                {
                    label: "Central Region", id: "MWI.2", children: [
                        {label: "Dedza", id: "MWI.2.1"},
                        {label: "Dowa", id: "MWI.2.2"}
                    ]
                }]
        };

        const testRootState = mockRootState({
            baseline: mockBaselineState({
                shape: {
                    filelabel: "test.shape",
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

        const filters = getters.regionOptions(testState, null, testRootState);
        expect(filters).toStrictEqual(testFilters.children); //We skip top level and use its options as our region array

    });

    it("gets unfilteredData when selectedDataType is Survey", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.Survey},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;

        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {
                    survey: mockSurveyResponse(
                        {data: "TEST" as any}
                    )
                }),
            filteredData: testState
        });

        const unfilteredData = getUnfilteredData(testState, testRootState);
        expect(unfilteredData).toStrictEqual("TEST");
    });

    it("gets unfilteredData when selectedDataType is Program", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.Program},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;

        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {
                    program: mockProgramResponse(
                        {data: "TEST" as any}
                    )
                }),
            filteredData: testState
        });

        const unfilteredData = getUnfilteredData(testState, testRootState);
        expect(unfilteredData).toStrictEqual("TEST");
    });

    it("gets unfilteredData when selectedDataType is ANC", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.ANC},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;

        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {
                    anc: mockAncResponse(
                        {data: "TEST" as any}
                    )
                }),
            filteredData: testState
        });

        const unfilteredData = getUnfilteredData(testState, testRootState);
        expect(unfilteredData).toStrictEqual("TEST");
    });

    it("gets unfilteredData when selectedDataType is Output", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.Output},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;

        const testRootState = mockRootState({
            modelRun: mockModelRunState(
                {
                    result: mockModelResultResponse(
                        {data: "TEST" as any}
                    )
                }),
            filteredData: testState
        });

        const unfilteredData = getUnfilteredData(testState, testRootState);
        expect(unfilteredData).toStrictEqual("TEST");
    });

    it("gets unfilteredData when selectedDataType is unknown", () => {
        const testStore: Module<FilteredDataState, RootState> = {
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

    it("can flatten options", () => {

        const testData: NestedFilterOption[] = [
            {
                id: "1", label: "name1", children: [{
                    id: "2", label: "nested", children: []
                }]
            }
        ];

        const result = flattenOptions(testData);
        expect(result["1"]).toStrictEqual(testData[0]);
        expect(result["2"]).toStrictEqual({id: "2", label: "nested", children: []});
    });

    it("gets flattened selected region filter", () => {

        const testRegions = [{
            id: "R1",
            label: "Region 1",
            children: [
                {
                    id: "R2",
                    label: "Region 2"
                },
                {
                    id: "R3",
                    label: "Region 3",
                    children: [
                        {
                            id: "R4",
                            label: "Region 4"
                        }
                    ]
                }
            ]
        }];
        const testStore: Module<FilteredDataState, RootState> = {
            state: {
                ...initialFilteredDataState,
                selectedDataType: DataType.ANC,
                selectedChoroplethFilters: {
                    age: {id: "1", label: "0-99"},
                    survey: null,
                    sex: {id: "male", label: "male"},
                    quarter: null,
                    regions: testRegions
                }
            },
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;


        const flattenedRegionFilter = getters.flattenedSelectedRegionFilters(testState);

        const expected = {
            "R1": testRegions[0],
            "R2": testRegions[0].children[0],
            "R3": testRegions[0].children[1],
            "R4": testRegions[0].children[1].children!![0]
        };

        expect(flattenedRegionFilter).toStrictEqual(expected);
    });

    it("gets flattened selected region filter when region filter is null", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: {
                ...initialFilteredDataState,
                selectedDataType: DataType.ANC,
                selectedChoroplethFilters: {
                    age: {id: "1", label: "0-99"},
                    survey: null,
                    sex: {id: "male", label: "male"},
                    quarter: null,
                    regions: null
                }
            },
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;

        const flattenedRegionFilter = getters.flattenedSelectedRegionFilters(testState);

        const expected = {};

        expect(flattenedRegionFilter).toStrictEqual(expected);
    });

    it("gets flattened region options", () => {

        const testRegions = [{
            id: "R1",
            label: "Region 1",
            children: [
                {
                    id: "R2",
                    label: "Region 2"
                },
                {
                    id: "R3",
                    label: "Region 3",
                    children: [
                        {
                            id: "R4",
                            label: "Region 4"
                        }
                    ]
                }
            ]
        }];
        const testStore: Module<FilteredDataState, RootState> = {
            state: {
                ...initialFilteredDataState
            }
        };
        const testState = testStore.state as FilteredDataState;
        const filterGetters = {
            ...testGetters,
            regionOptions: testRegions
        };

        const flattenedRegionOptions = getters.flattenedRegionOptions(testState, filterGetters);

        const expected = {
            "R1": testRegions[0],
            "R2": testRegions[0].children[0],
            "R3": testRegions[0].children[1],
            "R4": testRegions[0].children[1].children!![0]
        };

        expect(flattenedRegionOptions).toStrictEqual(expected);
    });

});