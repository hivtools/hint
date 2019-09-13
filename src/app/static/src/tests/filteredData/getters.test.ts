import {getters} from "../../app/store/filteredData/getters"
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
    mockSurveyResponse
} from "../mocks";
import {AgeFilters, NestedFilterOption, SurveyFilters} from "../../app/generated";
import {initialSurveyAndProgramDataState} from "../../app/store/surveyAndProgram/surveyAndProgram";

describe("FilteredData mutations", () => {
    it("gets correct selectedDataFilters when selectedDataType is Program", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.Program},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testFilters = mockAgeFilters({age: [{id: "age1", name: "0-4"}, {id: "age2", name: "5-9"}]});
        const testRootState = {
            version: "",
            selectedDataType: null,
            baseline: {...initialBaselineState},
            surveyAndProgram: mockSurveyAndProgramState(
                {program: mockProgramResponse(
                        {filters: testFilters}
                    )}),
            filteredData: testState
        };

        const filters = getters.selectedDataFilterOptions(testState, null, testRootState, null) as AgeFilters;
        expect(filters.age).toStrictEqual(testFilters.age);

    });

    it("gets correct selectedDataFilters when selectedDataType is Survey", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.Survey},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testFilters = mockSurveyFilters({
            age: [{id: "age1", name: "0-4"}, {id: "age2", name: "5-9"}],
            surveys: [{id: "s1", name: "Survey 1"}, {id: "s2", name: "Survey 2"}]});
        const testRootState = {
            version: "",
            selectedDataType: null,
            baseline: {...initialBaselineState},
            surveyAndProgram: mockSurveyAndProgramState(
                {survey: mockSurveyResponse(
                        {filters: testFilters}
                    )}),
            filteredData: testState
        };

        const filters = getters.selectedDataFilterOptions(testState, null, testRootState, null) as SurveyFilters;
        expect(filters.age).toStrictEqual(testFilters.age);
        expect(filters.surveys).toStrictEqual(testFilters.surveys);

    });

    it("gets correct selectedDataFilters when selectedDataType is ANC", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.ANC},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testFilters = mockAgeFilters({age: [{id: "age1", name: "0-4"}, {id: "age2", name: "5-9"}]});
        const testRootState = {
            version: "",
            selectedDataType: null,
            baseline: {...initialBaselineState},
            surveyAndProgram: mockSurveyAndProgramState(
                {anc: mockAncResponse(
                        {filters: testFilters}
                    )}),
            filteredData: testState
        };

        const filters = getters.selectedDataFilterOptions(testState, null, testRootState, null) as AgeFilters;
        expect(filters.age).toStrictEqual(testFilters.age);
    });

    it("gets region filters from shape", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testFilters =[
            {name: "Northern Region", id: "MWI.1", options: [
                    {name: "Chitipa", id: "MWI.1.1"},
                    {name: "Karonga", id: "MWI.1.2"}
                ]},
            {name: "Central Region", id: "MWI.2", options: [
                    {name: "Dedza", id: "MWI.2.1"},
                    {name: "Dowa", id: "MWI.2.2"}
                ]}
        ];

        const testRootState = {
            version: "",
            selectedDataType: null,
            baseline: mockBaselineState({shape: {
                    filename: "test.shape",
                    type: "shape",
                    data: {
                        type: "FeatureCollection",
                        features: []
                    },
                    filters: {regions: testFilters}}
            }),
            surveyAndProgram: {...initialSurveyAndProgramDataState},
            filteredData: testState
        };

        const filters = getters.regionOptions(testState, null, testRootState, null) as NestedFilterOption[];
        expect(filters).toStrictEqual(testFilters);

    });

    it("gets unfilteredData when selectedDataType is Survey", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.Survey},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                survey_id: "s1",
                indicator: "prevalence",
                value: 2
            },
            {
                iso3: "MWI",
                area_id: "area2",
                survey_id: "s2",
                indicator: "prevalence",
                value: 3
            }
        ];
        const testRootState = {
            version: "",
            selectedDataType: null,
            baseline: {...initialBaselineState},
            surveyAndProgram: mockSurveyAndProgramState(
                {survey: mockSurveyResponse(
                        {data: testData}
                    )}),
            filteredData: testState
        };

        const unfilteredData = getters.unfilteredData(testState, null, testRootState, null);
        expect(unfilteredData).toStrictEqual(testData);
    });

    it("gets unfilteredData when selectedDataType is Program", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.Program},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                indicator: "prevalence",
                value: 2
            },
            {
                iso3: "MWI",
                area_id: "area2",
                indicator: "prevalence",
                value: 3
            }
        ];
        const testRootState = {
            version: "",
            selectedDataType: null,
            baseline: {...initialBaselineState},
            surveyAndProgram: mockSurveyAndProgramState(
                {survey: mockSurveyResponse(
                        {data: testData}
                    )}),
            filteredData: testState
        };

        const unfilteredData = getters.unfilteredData(testState, null, testRootState, null);
        expect(unfilteredData).toStrictEqual(testData);
    });
});