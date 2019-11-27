import {flattenedSelectedRegionFilters, getters} from "../../app/store/filteredData/getters"
import {Module} from "vuex";
import {DataType, FilteredDataState} from "../../app/store/filteredData/filteredData";
import {RootState} from "../../app/root";
import {
    mockAncResponse,
    mockBaselineState,
    mockFilteredDataState,
    mockModelResultResponse,
    mockModelRunState,
    mockProgramFilters,
    mockProgramResponse,
    mockRootState,
    mockSurveyAndProgramState,
    mockSurveyFilters,
    mockSurveyResponse
} from "../mocks";
import {flattenOptions, getUnfilteredData} from "../../app/store/filteredData/utils";

export function testGetters(state: FilteredDataState) {
    return {excludeRow: getters.excludeRow(state)};
}

describe("FilteredData getters", () => {

    const sexOptions = [
        {id: "both", label: "both"},
        {id: "female", label: "female"},
        {id: "male", label: "male"}
    ];

    it("gets correct selectedDataFilters when selectedDataType is Program", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: mockFilteredDataState({selectedDataType: DataType.Program}),
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
            baseline: mockBaselineState({
                regionFilters: [{id: "MWI", label: "Malawi", children: []}]
            }),
            filteredData: testState
        });

        const mockGetters = testGetters(testState);
        const filters = getters.selectedDataFilterOptions(testState, mockGetters, testRootState)!!;
        expect(filters.age).toStrictEqual(testFilters.age);
        expect(filters.regions).toStrictEqual([{id: "MWI", label: "Malawi", children: []}]);
        expect(filters.sex).toStrictEqual(sexOptions);
        expect(filters.quarter).toBeUndefined();
    });

    it("gets correct selectedDataFilters when selectedDataType is Survey", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: mockFilteredDataState({selectedDataType: DataType.Survey}),
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
            baseline: mockBaselineState({
                regionFilters: [{id: "MWI", label: "Malawi", children: []}]
            }),
            filteredData: testState
        });

        const mockGetters = testGetters(testState);
        const filters = getters.selectedDataFilterOptions(testState, mockGetters, testRootState)!!;
        expect(filters.age).toStrictEqual(testFilters.age);
        expect(filters.regions).toStrictEqual([{id: "MWI", label: "Malawi", children: []}]);
        expect(filters.sex).toStrictEqual(sexOptions);
        expect(filters.surveys).toStrictEqual(testFilters.surveys);
        expect(filters.quarter).toBeUndefined();

    });

    it("gets correct selectedDataFilters when selectedDataType is ANC", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: mockFilteredDataState({selectedDataType: DataType.ANC}),
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
            baseline: mockBaselineState({
                regionFilters: [{id: "MWI", label: "Malawi", children: []}]
            }),
            filteredData: testState
        });

        const mockGetters = testGetters(testState);
        const filters = getters.selectedDataFilterOptions(testState, mockGetters, testRootState)!!;
        expect(filters.age).toStrictEqual(testFilters.age);
        expect(filters.regions).toStrictEqual([{id: "MWI", label: "Malawi", children: []}]);
        expect(filters.sex).toBeUndefined();
        expect(filters.surveys).toBeUndefined();
        expect(filters.quarter).toBeUndefined();
    });

    it("gets correct selectedDataFilters when selectedDataType is Output", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: mockFilteredDataState({selectedDataType: DataType.Output}),
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testFilters = [
            {id: "quarter", column_id: "calendar_quarter", label: "Quarter", options: [{id: "1", label: "2019 Q1"}]},
            {id: "age", column_id: "age_group", label: "Age", options: [{id: "1", label: "0-4"}]}
        ];
        const testRootState = mockRootState({
            modelRun: mockModelRunState(
                {
                    result: mockModelResultResponse(
                            {plottingMetadata: {
                                choropleth: {
                                    indicators: [],
                                    filters: testFilters
                                },
                                barchart: {
                                   indicators: [], filters: []
                                }
                            }
                         }
                    )
                }),
            baseline: mockBaselineState({
                regionFilters: [{id: "MWI", label: "Malawi", children: []}]
            }),
            filteredData: testState
        });

        const mockGetters = testGetters(testState);
        const filters = getters.selectedDataFilterOptions(testState, mockGetters, testRootState)!!;

        expect(filters.regions).toStrictEqual([{id: "MWI", label: "Malawi", children: []}]);
        expect(filters.sex).toStrictEqual(sexOptions);
        expect(filters.surveys).toBeUndefined();
        expect(filters.quarter).toStrictEqual(testFilters[0].options);
        expect(filters.age).toStrictEqual(testFilters[1].options);
    });

    it("gets null selectedDataFilters when unknown data type", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: mockFilteredDataState({selectedDataType: 99 as any}),
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testRootState = mockRootState();

        const filters = getters.selectedDataFilterOptions(testState, testGetters, testRootState)!;
        expect(filters).toBeNull();
    });

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

    const rootState = mockRootState({
        baseline: mockBaselineState({
            flattenedRegionFilters: flattenOptions(testRegions)
        })
    });

    it("gets flattened selected region filter", () => {

        const testStore: Module<FilteredDataState, RootState> = {
            state: mockFilteredDataState({
                selectedDataType: DataType.ANC,
                selectedChoroplethFilters: {
                    age: "1",
                    survey: "",
                    sex: "male",
                    year: "",
                    quarter: "",
                    regions: ["R1", "R2", "R3"]
                }
            }),
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;

        const flattenedRegionFilter = flattenedSelectedRegionFilters(testState, rootState);
        expect(flattenedRegionFilter).toStrictEqual(new Set(["R1", "R2", "R3", "R4"]));
    });

    it("gets flattened selected region filter when region filter is empty", () => {
        const testStore: Module<FilteredDataState, RootState> = {
            state: mockFilteredDataState({
                selectedDataType: DataType.ANC,
                selectedChoroplethFilters: {
                    age: "1",
                    survey: "",
                    sex: "male",
                    year: "",
                    quarter: "",
                    regions: []
                }
            }),
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const rootState = mockRootState({
            baseline: mockBaselineState({
                flattenedRegionFilters: flattenOptions(testRegions)
            })
        });

        const flattenedRegionFilter = flattenedSelectedRegionFilters(testState, rootState);
        expect(flattenedRegionFilter).toStrictEqual(new Set());
    });

});