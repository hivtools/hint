import {
    mockBaselineState, mockFilteredDataState,
    mockProgramResponse,
    mockRootState,
    mockSurveyAndProgramState
} from "../../mocks";
import {interpolateGreys} from "d3-scale-chromatic";
import {testIndicatorMetadata} from "./regionIndicators.test";
import {getRegionIndicators} from "../../../app/components/plots/utils";
import {DataType} from "../../../app/store/filteredData/filteredData";

const testMeta = testIndicatorMetadata("current_art", "current_art", "", "");

describe("getting region indicators for program data", () => {

    const getRootState = (testData: any,
                          filters: any) => mockRootState({
        baseline: mockBaselineState({
            country: "Malawi"
        }),
        surveyAndProgram: mockSurveyAndProgramState(
            {
                program: mockProgramResponse(
                    {data: testData}
                )
            }),
        filteredData: mockFilteredDataState({
            selectedDataType: DataType.Program,
            selectedChoroplethFilters: {regions: [], ...filters}
        })
    });

    it("gets regionIndicators for programme", () => {

        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                current_art: 0.2,
                age_group_id: "1",
                quarter_id: "1",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area2",
                current_art: 0.3,
                age_group_id: "1",
                quarter_id: "1",
                sex: "both"
            }
        ];
        const testRootState = getRootState(testData, {age: "1", sex: "both", quarter: "1"});

        const regionIndicators = getRegionIndicators(testRootState, testMeta);

        const expected = {
            "area1": {value: 0.2, color: interpolateGreys(0.2)},
            "area2": {value: 0.3, color: interpolateGreys(0.3)}
        };

        expect(regionIndicators).toStrictEqual(expected);
    });

    it("filters regionIndicators for programme", () => {

        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                current_art: 0.2,
                age_group_id: "1",
                quarter_id: "1",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area2",
                current_art: 0.3,
                age_group_id: "2",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area3",
                current_art: 0.4,
                age_group_id: "1",
                sex: "male"
            },
            {
                iso3: "MWI",
                area_id: "area4",
                current_art: 0.5,
            },
            {
                iso3: "MWI",
                area_id: "area5",
                current_art: 0.6,
                age_group_id: "1",
                quarter_id: "2",
                sex: "both"
            },
        ];
        const testRootState = getRootState(testData, {age: "1", sex: "both", quarter: "1"});

        const regionIndicators = getRegionIndicators(testRootState, testMeta);

        const expected = {
            "area1": {value: 0.2, color: interpolateGreys(0.2)}
        };

        expect(regionIndicators).toStrictEqual(expected);
    });

});
