import {DataType} from "../../app/store/surveyAndProgramData/filteredData";
import {
    mockBaselineState,
    mockFilteredDataState,
    mockRootState,
    mockSurveyAndProgramState,
    mockSurveyResponse
} from "../mocks";
import {interpolateGreys} from "d3-scale-chromatic";
import {getResult, testIndicatorMetadata} from "./helpers";
import {ModelResultRow, SurveyDataRow} from "../../app/generated";

describe("getRegionIndicators function", () => {

    const testMetadata = testIndicatorMetadata("prevalence", "est", "indicator", "prev");

    const getRootState = (testData: any,
                          selectedFilters: string[],
                          selectedDataType: DataType = DataType.Survey) => mockRootState({
        baseline: mockBaselineState({
            country: "Malawi",
            flattenedRegionFilters: {
                "area1": {
                    id: "area1",
                    label: "Area1",
                    children: [
                        {
                            id: "area2",
                            label: "Area2"
                        }
                    ]
                },
                "area2": {
                    id: "area1",
                    label: "Area1",
                    children: []
                }
            }
        }),
        surveyAndProgram: mockSurveyAndProgramState(
            {
                survey: mockSurveyResponse(
                    {data: testData}
                )
            }),
        filteredData: mockFilteredDataState({
            selectedDataType: selectedDataType,
            selectedChoroplethFilters: {regions: selectedFilters, age: "1", sex: "both", year: "", survey: "s1", quarter: "q1"}
        })
    });

    it("filters by region", () => {

        const testRow: Partial<SurveyDataRow> = {
            iso3: "MWI",
            area_id: "area1",
            survey_id: "s1",
            indicator: "prev",
            est: 0.2,
            age_group: "1",
            sex: "both"
        };
        const testData: Partial<SurveyDataRow>[] = [testRow,
            {
                ...testRow,
                area_id: "area2",
                est: 0.3
            },
            {
                ...testRow,
                area_id: "area3",
                est: 0.4
            },
            {
                ...testRow,
                area_id: "area4",
                est: 0.5
            }
        ];
        const testRootState = getRootState(testData, ["area1", "area2"]);
        const result = getResult(testRootState, testMetadata);

        const expected = {
            "area1": {"prevalence": {value: 0.2, color: interpolateGreys(0.2)}},
            "area2": {"prevalence": {value: 0.3, color: interpolateGreys(0.3)}}
        };

        expect(result).toStrictEqual(expected);
    });

    it("returns empty object if no data", () => {
        const testRootState = getRootState(null, ["area1", "area2"]);
        const result = getResult(testRootState, testMetadata);
        expect(result).toStrictEqual({});
    });

    it("gets empty regionIndicators if no selected data type", () => {

        const testData: Partial<SurveyDataRow>[] = [
            {
                iso3: "MWI",
                area_id: "area1",
                survey_id: "s1",
                indicator: "prev",
                est: 2,
                age_group: "1",
                sex: "both"
            }
        ];

        const testRootState = getRootState(testData, ["area1"], null as any);
        const result = getResult(testRootState, testMetadata);
        expect(result).toStrictEqual({});
    });

    it("returns all rows if no regions are selected", () => {

        const testData: Partial<SurveyDataRow>[] = [
            {
                iso3: "MWI",
                area_id: "area1",
                survey_id: "s1",
                indicator: "prev",
                est: 2,
                age_group: "1",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area2",
                survey_id: "s1",
                indicator: "prev",
                est: 3,
                age_group: "1",
                sex: "both"
            }
        ];

        const testRootState = getRootState(testData, []);
        const result = getResult(testRootState, testMetadata);
        expect(Object.keys(result)).toStrictEqual(["area1", "area2"]);
    });

    it("filters out rows with wrong indicators", () => {

        const testData: Partial<SurveyDataRow>[] = [
            {
                iso3: "MWI",
                area_id: "area1",
                survey_id: "s1",
                indicator: "artcov",
                est: 2,
                age_group: "1",
                sex: "both"
            }
        ];

        const testRootState = getRootState(testData, []);
        const result = getResult(testRootState, testMetadata);
        expect(result).toStrictEqual({});
    });

    it("filters out rows with no value", () => {

        const testData: Partial<SurveyDataRow>[] = [
            {
                iso3: "MWI",
                area_id: "area1",
                survey_id: "s1",
                indicator: "prev",
                age_group: "1",
                est: undefined,
                sex: "both"
            }
        ];

        const testRootState = getRootState(testData, []);
        const result = getResult(testRootState, testMetadata);
        expect(result).toStrictEqual({});
    });

});
