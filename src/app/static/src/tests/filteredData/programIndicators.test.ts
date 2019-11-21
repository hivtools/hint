import {
    mockBaselineState,
    mockFilteredDataState,
    mockProgramResponse,
    mockRootState,
    mockSurveyAndProgramState
} from "../mocks";
import {interpolateGreys} from "d3-scale-chromatic";
import {DataType} from "../../app/store/filteredData/filteredData";
import {getResult, testIndicatorMetadata} from "./helpers";
import {ProgrammeDataRow} from "../../app/generated";

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
        const testRootState = getRootState(null, {age: "1", sex: "both", survey: "s1", year: "1"});
        testRootState.surveyAndProgram.program = null;
        const result = getResult(testRootState, testMeta);
        expect(result).toStrictEqual({});
    });

    it("gets regionIndicators for programme", () => {

        const testData: Partial<ProgrammeDataRow>[] = [
            {
                area_id: "area1",
                current_art: 0.2,
                age_group: "1",
                year: 1,
                sex: "both"
            },
            {
                area_id: "area2",
                current_art: 0.3,
                age_group: "1",
                year: 1,
                sex: "both"
            }
        ];
        const rootState = getRootState(testData, {age: "1", sex: "both", year: "1"});
        const result = getResult(rootState, testMeta);

        const expected = {
            "area1": {"current_art": {value: 0.2, color: interpolateGreys(0.2)}},
            "area2": {"current_art": {value: 0.3, color: interpolateGreys(0.3)}}
        };

        expect(result).toStrictEqual(expected);
    });

    it("filters regionIndicators for programme", () => {

        const testRow: Partial<ProgrammeDataRow> = {
            area_id: "area1",
            current_art: 0.2,
            age_group: "1",
            year: 1,
            sex: "both"
        };

        const testData: Partial<ProgrammeDataRow>[] = [testRow,
            {
                ...testRow,
                area_id: "area2",
                age_group: "2" // wrong age
            },
            {
                ...testRow,
                area_id: "area3",
                sex: "male" //wrong sex
            },
            {
                ...testRow,
                area_id: "area5",
                year: 2 // wrong year
            },
        ];
        const rootState = getRootState(testData, {age: "1", sex: "both", year: "1"});
        const result = getResult(rootState, testMeta);
        const expected = {
            "area1": {"current_art": {value: 0.2, color: interpolateGreys(0.2)}}
        };

        expect(result).toStrictEqual(expected);
    });

});
