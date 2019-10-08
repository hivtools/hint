
import {getters} from "../../app/store/filteredData/getters"
import {Module} from "vuex";
import {DataType, FilteredDataState, initialFilteredDataState} from "../../app/store/filteredData/filteredData";
import {RootState} from "../../app/root";
import {
    mockAncResponse,
    mockProgramResponse,
    mockSurveyAndProgramState,
    mockSurveyResponse,
    mockRootState,
    mockModelRunState, mockModelResultResponse
} from "../mocks";
import {testGetters} from "./getters.test";

describe("FilteredData regionIndicator getter", () => {

    it("gets regionIndicators for survey", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {
                ...initialFilteredDataState,
                selectedDataType: DataType.Survey,
                selectedChoroplethFilters: {
                    age: {id: "1", name: "0-99"},
                    survey: {id: "s1", name: "Survey 1"},
                    sex: {id: "both", name: "both"},
                    regions: null
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
                    sex: {id: "both", name: "both"},
                    regions: null
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
                    sex: {id: "both", name: "both"},
                    regions: null
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
                    sex: {id: "both", name: "both"},
                    regions: null
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
                    sex: null,
                    regions: null
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
                    sex: {id: "male", name: "male"}, //should be ignored
                    regions: null
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

    it("gets regionIndicators for Output", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {
                ...initialFilteredDataState,
                selectedDataType: DataType.Output,
                selectedChoroplethFilters: {
                    age: {id: "1", name: "0-99"},
                    survey: null,
                    sex: {id: "both", name: "both"},
                    regions: null
                }
            },
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                mean: 2,
                age_group_id: 1,
                indicator_id: 2,
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area2",
                mean: 3,
                age_group_id: 1,
                indicator_id: 2,
                sex: "both"
            }
        ];
        const testRootState = mockRootState({
            modelRun: mockModelRunState(
                {result: mockModelResultResponse(
                        {data: testData as any}
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

    it("filters regionIndicators for Output", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {
                ...initialFilteredDataState,
                selectedDataType: DataType.Output,
                selectedChoroplethFilters: {
                    age: {id: "1", name: "0-99"},
                    survey: null,
                    sex: {id: "both", name: "both"},
                    regions: null
                }
            },
            getters: getters
        };
        const testState = testStore.state as FilteredDataState;
        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                mean: 2,
                age_group_id: 1,
                indicator_id: 2,
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area2",
                mean: 3,
                age_group_id: 1,
                indicator_id: 2,
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area3",
                mean: 4,
                age_group_id: 1,
                indicator_id: 2,
                sex: "male"
            },
            {
                iso3: "MWI",
                area_id: "area4",
                mean: 5,
                age_group_id: 2,
                indicator_id: 2,
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area5",
                mean: 6,
                age_group_id: 1,
                indicator_id: 3,
                sex: "both"
            }
        ];
        const testRootState = mockRootState({
            modelRun: mockModelRunState(
                {result: mockModelResultResponse(
                        {data: testData as any}
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

    it("filters regionIndicators by region", () => {
        const testStore:  Module<FilteredDataState, RootState> = {
            state: {
                ...initialFilteredDataState,
                selectedDataType: DataType.Survey,
                selectedChoroplethFilters: {
                    age: {id: "1", name: "0-99"},
                    survey: {id: "s1", name: "Survey 1"},
                    sex: {id: "both", name: "both"},
                    regions: [{
                        id: "area1",
                        name: "Area 1",
                        options: [
                            {id: "area2", name: "Area 2"}
                        ]
                    }]
                }
            }
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
                indicator: "prev",
                est: 4,
                age_group_id: "1",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area4",
                survey_id: "s1",
                indicator: "prev",
                est: 5,
                age_group_id: "1",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area1",
                survey_id: "s1",
                indicator: "prev",
                est: 6,
                age_group_id: "1",
                sex: "male"
            }

        ];
        const testRootState = mockRootState({
            surveyAndProgram: mockSurveyAndProgramState(
                {survey: mockSurveyResponse(
                        {data: testData}
                    )}),
            filteredData: testState});

        const testRegionGetters = {
            ...testGetters,
            flattenedSelectedRegionFilter: {
                "area1": {},
                "area2": {}
            }

        };

        const regionIndicators = getters.regionIndicators(testState, testRegionGetters, testRootState, null);

        const expected = {
            "area1":
                {
                    "prev": {value: 2, color: "rgb(0,2,0)"}
                },
            "area2":
                {
                    "prev": {value: 3, color: "rgb(0,3,0)"}
                }
        };

        expect(regionIndicators).toStrictEqual(expected);
    });
});