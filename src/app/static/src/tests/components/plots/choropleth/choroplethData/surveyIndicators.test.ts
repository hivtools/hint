import {
    mockBaselineState,
    mockFilteredDataState,
    mockRootState,
    mockSurveyAndProgramState,
    mockSurveyResponse
} from "../../../../mocks";
import {interpolateGreys} from "d3-scale-chromatic";
import {testIndicatorMetadata} from "./regionIndicators.test";
import {DataType} from "../../../../../app/store/filteredData/filteredData";
import {getRegionIndicators} from "../../../../../app/components/plots/choroplethData";

describe("getting region indicators for survey data", () => {

    const testMeta = testIndicatorMetadata("art_coverage", "est", "indicator", "artcov");

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

    it("returns empty object if survey is null", () => {
        const testRootState = getRootState(null, {age: "1", sex: "both", survey: "s1", quarter: "1"});
        testRootState.surveyAndProgram.survey = null;
        const regionIndicators = getRegionIndicators(testRootState, testMeta);
        expect(regionIndicators).toStrictEqual({});
    });

    it("gets regionIndicators for survey", () => {

        const testRow = {
            area_id: "area1",
            survey_id: "s1",
            indicator: "artcov",
            est: 0.2,
            age_group_id: "1",
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
        const testRootState = getRootState(testData, {age: "1", sex: "both", survey: "s1", quarter: "1"});
        const regionIndicators = getRegionIndicators(testRootState, testMeta);

        const expected = {
            "area1": {value: 0.2, color: interpolateGreys(0.2)},
            "area2": {value: 0.3, color: interpolateGreys(0.3)}
        };

        expect(regionIndicators).toStrictEqual(expected);
    });

    it("filters regionIndicators for survey", () => {

        const testRow = {
            area_id: "area1",
            survey_id: "s1",
            indicator: "artcov",
            est: 0.2,
            age_group_id: "1",
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
                age_group_id: "2" // wrong age
            },
            {
                area_id: "area4",
                sex: "female" // wrong sex
            },

        ];
        const testRootState = getRootState(testData, {age: "1", sex: "both", survey: "s1"});
        const regionIndicators = getRegionIndicators(testRootState, testMeta);

        const expected = {
            "area1": {value: 0.2, color: interpolateGreys(0.2)}
        };

        expect(regionIndicators).toStrictEqual(expected);
    });

});