import {getters} from "../../app/store/filteredData/getters"
import {initialBaselineState} from "../../app/store/baseline/baseline";
import {Module} from "vuex";
import {
    DataType,
    FilteredDataState,
    initialFilteredDataState
} from "../../app/store/filteredData/filteredData";
import {RootState} from "../../app/root";
import {
    mockSurveyAndProgramState,
    mockProgramResponse,
    mockAgeFilters,
    mockSurveyFilters,
    mockSurveyResponse, mockAncResponse
} from "../mocks";
import {AgeFilters, SurveyFilters} from "../../app/generated";

describe("FilteredData mutations", () => {
    it("gets correct selectedDataFilters when selectedDataType is Program", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.Program},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testFilters = mockAgeFilters({age: ["age1", "age2"]});
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
        expect(filters.age).toStrictEqual(["age1", "age2"]);

    });

    it("gets correct selectedDataFilters when selectedDataType is Survey", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.Survey},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testFilters = mockSurveyFilters({age: ["age1", "age2"], survey: ["s1", "s2"]});
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
        expect(filters.age).toStrictEqual(["age1", "age2"]);
        expect(filters.survey).toStrictEqual(["s1", "s2"]);

    });

    it("gets correct selectedDataFilters when selectedDataType is ANC", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {...initialFilteredDataState, selectedDataType: DataType.ANC},
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testFilters = mockAgeFilters({age: ["age1", "age2"]});
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
        expect(filters.age).toStrictEqual(["age1", "age2"]);


    });
});