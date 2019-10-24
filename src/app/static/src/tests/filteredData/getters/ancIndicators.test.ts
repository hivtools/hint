import {
    mockAncResponse,
    mockBaselineState, mockFilteredDataState,
    mockProgramResponse,
    mockRootState,
    mockSurveyAndProgramState
} from "../../mocks";
import {interpolateGreys} from "d3-scale-chromatic";
import {testIndicatorMetadata} from "./regionIndicators.test";
import {getRegionIndicators} from "../../../app/components/plots/utils";
import {DataType} from "../../../app/store/filteredData/filteredData";

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

    it("gets regionIndicators for ANC", () => {

        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                art_coverage: 0,
                prevalence: 0.2,
                age_group_id: 1,
                quarter_id: 1
            },
            {
                iso3: "MWI",
                area_id: "area2",
                art_coverage: 0.4,
                prevalence: 0.3,
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

        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                prevalence: 0.2,
                art_coverage: 0,
                age_group_id: 1,
                quarter_id: "1"
            },
            {
                iso3: "MWI",
                area_id: "area2",
                prevalence: 0.3,
                art_coverage: 0.4,
                age_group_id: 1,
                quarter_id: "1"
            },
            {
                iso3: "MWI",
                area_id: "area3",
                art_coverage: 0.4,
                age_group_id: 2,
                quarter_id: "1"
            },
            {
                iso3: "MWI",
                area_id: "area4",
                prevalence: 0.4,
                art_coverage: 0.6,
                age_group_id: 1,
                quarter_id: "2"
            }
        ];
        const testRootState = getRootState(testData, {age: "1", quarter: "1"});
        const regionIndicators = getRegionIndicators(testRootState, testMeta);
        const expected = {
            "area1": {value: 0, color: interpolateGreys(0)},
            "area2": {value: 0.4, color: interpolateGreys(0.4)},
            "area3": {value: 0.4, color: interpolateGreys(0.4)}
        };

        expect(regionIndicators).toStrictEqual(expected);
    });

});
