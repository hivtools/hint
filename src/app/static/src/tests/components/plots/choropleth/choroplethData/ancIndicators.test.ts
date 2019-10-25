import {
    mockAncResponse,
    mockBaselineState,
    mockFilteredDataState,
    mockRootState,
    mockSurveyAndProgramState
} from "../../../../mocks";
import {interpolateGreys} from "d3-scale-chromatic";
import {testIndicatorMetadata} from "./regionIndicators.test";
import {getRegionIndicators} from "../../../../../app/components/plots/choroplethData";
import {DataType} from "../../../../../app/store/filteredData/filteredData";

describe("getting region indicators for ANC data", () => {

    const testMeta = testIndicatorMetadata("art_coverage", "art_coverage", "", "");

    const getRootState = (testData: any,
                          filters: any) => mockRootState({
        baseline: mockBaselineState({
            country: "Malawi"
        }),
        surveyAndProgram: mockSurveyAndProgramState(
            {
                anc: mockAncResponse(
                    {data: testData}
                )
            }),
        filteredData: mockFilteredDataState({
            selectedDataType: DataType.ANC,
            selectedChoroplethFilters: {regions: [], ...filters}
        })
    });

    it("returns empty object if survey is null", () => {
        const testRootState = getRootState(null, {age: "1", sex: "both", survey: "s1", quarter: "1"});
        testRootState.surveyAndProgram.anc = null;
        const regionIndicators = getRegionIndicators(testRootState, testMeta);
        expect(regionIndicators).toStrictEqual({});
    });

    it("gets regionIndicators for ANC", () => {

        const testData = [
            {
                area_id: "area1",
                art_coverage: 0,
                age_group_id: 1,
                quarter_id: 1
            },
            {
                area_id: "area2",
                art_coverage: 0.4,
                age_group_id: 1,
                quarter_id: 1
            }
        ];
        const testRootState = getRootState(testData, {age: "1", quarter: "1"});
        const regionIndicators = getRegionIndicators(testRootState, testMeta);
        const expected = {

            "area1": {value: 0, color: interpolateGreys(0)},
            "area2": {value: 0.4, color: interpolateGreys(0.4)}
        };

        expect(regionIndicators).toStrictEqual(expected);
    });

    it("filter regionIndicators for ANC", () => {

        const testRow = {
            area_id: "area1",
            art_coverage: 0.4,
            age_group_id: 1,
            quarter_id: "1"
        };

        const testData = [testRow,
            {
                ...testRow,
                area_id: "area2"
            },
            {
                ...testRow,
                area_id: "area3",
                age_group_id: 2 // wrong age
            },
            {
                ...testRow,
                area_id: "area4",
                quarter_id: "2" // wrong quarter
            }
        ];
        const testRootState = getRootState(testData, {age: "1", quarter: "1"});
        const regionIndicators = getRegionIndicators(testRootState, testMeta);
        const expected = {
            "area1": {value: 0.4, color: interpolateGreys(0.4)},
            "area2": {value: 0.4, color: interpolateGreys(0.4)},
            "area3": {value: 0.4, color: interpolateGreys(0.4)}
        };

        expect(regionIndicators).toStrictEqual(expected);
    });

});
