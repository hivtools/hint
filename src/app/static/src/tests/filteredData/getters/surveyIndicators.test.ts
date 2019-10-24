import {
    mockBaselineState,
    mockFilteredDataState,
    mockRootState,
    mockShapeResponse,
    mockSurveyAndProgramState,
    mockSurveyResponse
} from "../../mocks";
import {interpolateGreys} from "d3-scale-chromatic";
import {testIndicatorMetadata} from "./regionIndicators.test";
import {getRegionIndicators} from "../../../app/components/plots/utils";
import {DataType} from "../../../app/store/filteredData/filteredData";

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

    it("gets regionIndicators for survey", () => {

        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                survey_id: "s1",
                indicator: "artcov",
                est: 0.2,
                age_group_id: "1",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area2",
                survey_id: "s1",
                indicator: "artcov",
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
                indicator: "prev",
                est: 0.5,
                age_group_id: "1",
                sex: "both"
            }
        ];
        const testRootState = getRootState(testData, {age: "1", sex: "both", survey: "s1", quarter: "1"});
        const regionIndicators = getRegionIndicators(testRootState, testMeta);

        const expected = {
            "area1": {value: 0.2, color: interpolateGreys(0.2)},
            "area2": {value: 0.3, color: interpolateGreys(0.3)},
            "area3": {value: 0.4, color: interpolateGreys(0.4)}
        };

        expect(regionIndicators).toStrictEqual(expected);
    });

    it("filters regionIndicators for survey", () => {

        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                survey_id: "s1",
                indicator: "artcov",
                est: 0.2,
                age_group_id: "1",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area2",
                survey_id: "s2",
                indicator: "artcov",
                est: 0.3,
                age_group_id: "1",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area3",
                survey_id: "s2",
                indicator: "artcov",
                est: 0.4,
                age_group_id: "2",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area4",
                survey_id: "s1",
                indicator: "artcov",
                est: 0.5,
                age_group_id: "1",
                sex: "female"
            },

        ];
        const testRootState = getRootState(testData, {age: "1", sex: "both", survey: "s1", quarter: "1"});
        const regionIndicators = getRegionIndicators(testRootState, testMeta);

        const expected = {
            "area1": {value: 0.2, color: interpolateGreys(0.2)}
        };

        expect(regionIndicators).toStrictEqual(expected);
    });

});