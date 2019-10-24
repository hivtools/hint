import {DataType} from "../../../app/store/filteredData/filteredData";
import {
    mockBaselineState,
    mockFilteredDataState,
    mockRootState,
    mockShapeResponse,
    mockSurveyAndProgramState,
    mockSurveyResponse
} from "../../mocks";
import {interpolateGreys} from "d3-scale-chromatic";
import {getRegionIndicators} from "../../../app/components/plots/utils";
import {IndicatorMetadata} from "../../../app/generated";

export function testIndicatorMetadata(indicator: string,
                                      value_column: string,
                                      indicator_column: string,
                                      indicator_value: string): IndicatorMetadata {
    return {
        name: indicator,
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

describe("getRegionIndicators function", () => {

    const testMetadata = testIndicatorMetadata("prevalence", "est", "indicator", "prev");

    const getRootState = (testData: any,
                          selectedFilters: string[],
                          selectedDataType: DataType = DataType.Survey) => mockRootState({
        baseline: mockBaselineState({
            country: "Malawi",
            shape: mockShapeResponse({
                filters: {
                    regions: {
                        id: "MWI",
                        label: "Malawi",
                        children: [
                            {
                                id: "area1", label: "Area1",
                                children: [
                                    {id: "area2", label: "Area2"}
                                ]
                            }
                        ]
                    }
                }
            })
        }),
        surveyAndProgram: mockSurveyAndProgramState(
            {
                survey: mockSurveyResponse(
                    {data: testData}
                )
            }),
        filteredData: mockFilteredDataState({
            selectedDataType: selectedDataType,
            selectedChoroplethFilters: {regions: selectedFilters, age: "1", sex: "both", quarter: null, survey: "s1"}
        })
    });

    it("filters by region", () => {

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
        const testRootState = getRootState(testData, ["area1", "area2"]);
        const regionIndicators = getRegionIndicators(testRootState, testMetadata);

        const expected = {
            "area1": {value: 0.2, color: interpolateGreys(0.2)},
            "area2": {value: 0.3, color: interpolateGreys(0.3)}
        };

        expect(regionIndicators).toStrictEqual(expected);
    });

    it("returns empty object if no data", () => {
        const testRootState = getRootState(null, ["area1", "area2"]);
        const regionIndicators = getRegionIndicators(testRootState, testMetadata);
        expect(regionIndicators).toStrictEqual({});
    });

    it("gets empty regionIndicators if no selected data type", () => {

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

        const testRootState = getRootState(testData, ["area1", "area2"], null as any);
        const regionIndicators = getRegionIndicators(testRootState, testMetadata);
        expect(regionIndicators).toStrictEqual({});
    });

    it("returns all rows if no regions are selected", () => {

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

        const testRootState = getRootState(testData, []);
        const regionIndicators = getRegionIndicators(testRootState, testMetadata);
        expect(Object.keys(regionIndicators)).toStrictEqual(["area1", "area2"]);
    });
});