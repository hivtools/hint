import {
    mockBaselineState,
    mockFilteredDataState,
    mockModelResultResponse,
    mockModelRunState,
    mockRootState
} from "../../../../mocks";
import {interpolateGreys} from "d3-scale-chromatic";
import {testIndicatorMetadata} from "./regionIndicators.test";
import {getRegionIndicators} from "../../../../../app/components/plots/choroplethData";
import {DataType} from "../../../../../app/store/filteredData/filteredData";

describe("getting region indicators for output data", () => {

    const testMeta = testIndicatorMetadata("prevalence", "mean", "indicator_id", "2");

    const getRootState = (testData: any,
                          selectedFilters: any) => mockRootState({
        baseline: mockBaselineState({
            country: "Malawi"
        }),
        modelRun: mockModelRunState({
            result: mockModelResultResponse({
                data: testData
            })
        }),
        filteredData: mockFilteredDataState({
            selectedDataType: DataType.Output,
            selectedChoroplethFilters: selectedFilters
        })
    });

    it("returns empty object if survey is null", () => {
        const testRootState = getRootState(null, {age: "1", sex: "both", survey: "s1", quarter: "1"});
        testRootState.modelRun.result = null;
        const regionIndicators = getRegionIndicators(testRootState, testMeta);
        expect(regionIndicators).toStrictEqual({});
    });

    it("gets regionIndicators for Output", () => {

        const testData = [
            {
                area_id: "area1",
                mean: 0.2,
                age_group_id: 1,
                indicator_id: 2,
                sex: "both"
            },
            {
                area_id: "area2",
                mean: 0.3,
                age_group_id: 1,
                indicator_id: 2,
                sex: "both"
            }
        ];
        const testRootState = getRootState(testData, {age: "1", sex: "both"});

        const regionIndicators = getRegionIndicators(testRootState, testMeta);

        const expected = {
            "area1": {value: 0.2, color: interpolateGreys(0.2)},
            "area2": {value: 0.3, color: interpolateGreys(0.3)}
        };

        expect(regionIndicators).toStrictEqual(expected);
    });

    it("filters regionIndicators for Output", () => {

        const testRow = {
            area_id: "area1",
            mean: 0.2,
            age_group_id: 1,
            indicator_id: "2",
            sex: "both"
        };
        const testData = [testRow,
            {
                ...testRow,
                area_id: "area2",
                mean: 0.3
            },
            {
                ...testRow,
                area_id: "area3",
                sex: "male" // wrong sex
            },
            {
                ...testRow,
                area_id: "area4",
                age_group_id: 2 // wrong age
            },
            {
                area_id: "area5",
                indicator_id: "3" // wrong indicator id
            }
        ];
        const testRootState = getRootState(testData, {age: "1", sex: "both"});

        const regionIndicators = getRegionIndicators(testRootState, testMeta);

        const expected = {
            "area1": {value: 0.2, color: interpolateGreys(0.2)},
            "area2": {value: 0.3, color: interpolateGreys(0.3)}
        };

        expect(regionIndicators).toStrictEqual(expected);
    });

});
