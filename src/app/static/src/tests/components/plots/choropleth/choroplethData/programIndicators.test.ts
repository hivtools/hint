import {
    mockBaselineState,
    mockFilteredDataState,
    mockProgramResponse,
    mockRootState,
    mockSurveyAndProgramState
} from "../../../../mocks";
import {interpolateGreys} from "d3-scale-chromatic";
import {testIndicatorMetadata} from "./regionIndicators.test";
import {getRegionIndicators} from "../../../../../app/components/plots/choroplethData";
import {DataType} from "../../../../../app/store/filteredData/filteredData";

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

    it("returns empty object if survey is null", () => {
        const testRootState = getRootState(null, {age: "1", sex: "both", survey: "s1", quarter: "1"});
        testRootState.surveyAndProgram.program = null;
        const regionIndicators = getRegionIndicators(testRootState, testMeta);
        expect(regionIndicators).toStrictEqual({});
    });

    it("gets regionIndicators for programme", () => {

        const testData = [
            {
                area_id: "area1",
                current_art: 0.2,
                age_group_id: "1",
                quarter_id: "1",
                sex: "both"
            },
            {
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

        const testRow = {
            area_id: "area1",
            current_art: 0.2,
            age_group_id: "1",
            quarter_id: "1",
            sex: "both"
        };

        const testData = [testRow,
            {
                ...testRow,
                area_id: "area2",
                age_group_id: "2" // wrong age
            },
            {
                ...testRow,
                area_id: "area3",
                sex: "male" //wrong sex
            },
            {
                ...testRow,
                area_id: "area5",
                quarter_id: "2" // wrong quarter
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
