import {
    mockBaselineState,
    mockFilteredDataState,
    mockRootState,
    mockSurveyAndProgramState,
    mockSurveyResponse
} from "../mocks";
import {interpolateGreys} from "d3-scale-chromatic";
import {DataType} from "../../app/store/filteredData/filteredData";
import {getGetters, testIndicatorMetadata} from "./helpers";
import {getters} from "../../app/store/filteredData/getters";
import {RootState} from "../../app/root";

describe("getting region indicators for survey data", () => {

    const testMeta = testIndicatorMetadata("art_coverage", "est", "indicator", "artcov");
    const testRootGetters = {
        "metadata/choroplethIndicatorsMetadata": [testMeta]
    };

    const getRootState = (testData: any,
                          filters: any) => mockRootState({
        baseline: mockBaselineState({
            country: "Malawi"
        }),
        surveyAndProgram: mockSurveyAndProgramState(
            {
                survey: mockSurveyResponse(
                    {data: testData}
                )
            }),
        filteredData: mockFilteredDataState({
            selectedDataType: DataType.Survey,
            selectedChoroplethFilters: {regions: [], ...filters}
        })
    });

    function getResult(testData: any, filters: any) {
        const testRootState = getRootState(testData, filters);
        const testGetters = getGetters(testRootState);
        return getters.regionIndicators(testRootState.filteredData,
            testGetters,
            testRootState,
            testRootGetters);
    }

    it("returns empty object if survey is null", () => {
        const testRootState = getRootState(null, {age: "1", sex: "both", survey: "s1", year: "1"});
        testRootState.surveyAndProgram.survey = null;
        const testGetters = getGetters(testRootState);
        const regionIndicators = getters.regionIndicators(testRootState.filteredData,
            testGetters,
            testRootState,
            testRootGetters);
        expect(regionIndicators).toStrictEqual({});
    });

    it("gets regionIndicators for survey", () => {

        const testRow = {
            area_id: "area1",
            survey_id: "s1",
            indicator: "artcov",
            est: 0.2,
            age_group: "1",
            sex: "both"
        };
        const testData = [
            testRow,
            {
                ...testRow,
                area_id: "area2",
                est: 0.3
            }
        ];
        const result = getResult(testData, {age: "1", sex: "both", survey: "s1", year: "1"});

        const expected = {
            "area1": {"art_coverage": {value: 0.2, color: interpolateGreys(0.2)}},
            "area2": {"art_coverage": {value: 0.3, color: interpolateGreys(0.3)}}
        };

        expect(result).toStrictEqual(expected);
    });

    it("filters regionIndicators for survey", () => {

        const testRow = {
            area_id: "area1",
            survey_id: "s1",
            indicator: "artcov",
            est: 0.2,
            age_group: "1",
            sex: "both"
        };

        const testData = [
            testRow,
            {
                ...testRow,
                area_id: "area2",
                survey_id: "s2" // wrong survey
            },
            {
                ...testRow,
                area_id: "area3",
                age_group: "2" // wrong age
            },
            {
                area_id: "area4",
                sex: "female" // wrong sex
            },

        ];
        const result = getResult(testData, {age: "1", sex: "both", survey: "s1"});

        const expected = {
            "area1": {"art_coverage": {value: 0.2, color: interpolateGreys(0.2)}}
        };

        expect(result).toStrictEqual(expected);
    });

});
