import {
    mockBaselineState,
    mockFilteredDataState,
    mockModelResultResponse,
    mockModelRunState,
    mockRootState
} from "../../mocks";
import {interpolateGreys} from "d3-scale-chromatic";
import {testIndicatorMetadata} from "./regionIndicators.test";
import {getRegionIndicators} from "../../../app/components/plots/utils";
import {DataType} from "../../../app/store/filteredData/filteredData";

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

    it("gets regionIndicators for Output", () => {

        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                mean: 0.2,
                age_group_id: 1,
                indicator_id: 2,
                sex: "both"
            },
            {
                iso3: "MWI",
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

        const testData = [
            {
                iso3: "MWI",
                area_id: "area1",
                mean: 0.2,
                age_group_id: 1,
                indicator_id: "2",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area2",
                mean: 0.3,
                age_group_id: 1,
                indicator_id: "2",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area3",
                mean: 0.4,
                age_group_id: 1,
                indicator_id: "2",
                sex: "male"
            },
            {
                iso3: "MWI",
                area_id: "area4",
                mean: 0.5,
                age_group_id: 2,
                indicator_id: "2",
                sex: "both"
            },
            {
                iso3: "MWI",
                area_id: "area5",
                mean: 0.6,
                age_group_id: 1,
                indicator_id: "3",
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

});
