import {getters} from "../../../app/store/filteredData/getters"
import {DataType} from "../../../app/store/filteredData/filteredData";
import {
    mockAncResponse,
    mockBaselineState,
    mockFilteredDataState,
    mockModelResultResponse,
    mockModelRunState,
    mockProgramFilters,
    mockProgramResponse,
    mockRootState,
    mockShapeResponse,
    mockSurveyAndProgramState,
    mockSurveyFilters,
    mockSurveyResponse
} from "../../mocks";
import {SurveyAndProgramDataState} from "../../../app/store/surveyAndProgram/surveyAndProgram";
import {ModelRunState} from "../../../app/store/modelRun/modelRun";

const getRootState = (surveyAndProgram: Partial<SurveyAndProgramDataState>,
                      modelRun: Partial<ModelRunState> = {}) => {
    return mockRootState({
        surveyAndProgram: mockSurveyAndProgramState(surveyAndProgram),
        baseline: mockBaselineState({
            shape: mockShapeResponse({
                filters: {
                    regions: {children: "TEST" as any} as any
                }
            })
        }),
        modelRun: mockModelRunState(modelRun)
    });
};


describe("Filtered data getters", () => {

    const sexOptions = [
        {id: "both", label: "both"},
        {id: "female", label: "female"},
        {id: "male", label: "male"}
    ];

    it("gets correct selectedDataFilters when selectedDataType is Program", () => {

        const testState = mockFilteredDataState({selectedDataType: DataType.Program});
        const testFilters = mockProgramFilters({age: [{id: "age1", label: "0-4"}, {id: "age2", label: "5-9"}]});
        const testRootState = getRootState({
                program: mockProgramResponse(
                    {filters: testFilters}
                )
            }
        );

        const filters = getters.selectedDataFilterOptions(testState, null, testRootState, null)!!;
        expect(filters.age).toStrictEqual(testFilters.age);
        expect(filters.regions).toStrictEqual("TEST");
        expect(filters.sex).toStrictEqual(sexOptions);
    });

    it("gets correct selectedDataFilters when selectedDataType is Survey", () => {

        const testState = mockFilteredDataState({selectedDataType: DataType.Survey});
        const testFilters = mockSurveyFilters({
            age: [{id: "age1", label: "0-4"}, {id: "age2", label: "5-9"}],
            surveys: [{id: "s1", label: "Survey 1"}, {id: "s2", label: "Survey 2"}]
        });
        const testRootState = getRootState({
            survey: mockSurveyResponse(
                {filters: testFilters}
            )
        });

        const filters = getters.selectedDataFilterOptions(testState, null, testRootState, null)!!;
        expect(filters.age).toStrictEqual(testFilters.age);
        expect(filters.regions).toStrictEqual("TEST");
        expect(filters.sex).toStrictEqual(sexOptions);
        expect(filters.surveys).toStrictEqual(testFilters.surveys);

    });

    it("gets correct selectedDataFilters when selectedDataType is ANC", () => {

        const testState = mockFilteredDataState({selectedDataType: DataType.ANC});
        const testFilters = mockProgramFilters({age: [{id: "age1", label: "0-4"}, {id: "age2", label: "5-9"}]});
        const testRootState = getRootState({
            anc: mockAncResponse(
                {filters: testFilters}
            )
        });

        const filters = getters.selectedDataFilterOptions(testState, null, testRootState, null)!!;
        expect(filters.age).toStrictEqual(testFilters.age);
        expect(filters.regions).toStrictEqual("TEST");
        expect(filters.sex).toBeUndefined();
        expect(filters.surveys).toBeUndefined();
    });

    it("gets correct selectedDataFilters when selectedDataType is Output", () => {

        const testState = mockFilteredDataState({selectedDataType: DataType.Output});
        const testFilters = {
            age: [{id: "age1", label: "0-4"}, {id: "age2", label: "5-9"}],
            quarter: [{id: "1", label: "2019 Q1"}],
            indicators: []
        };
        const testRootState = getRootState({}, {
            result: mockModelResultResponse(
                {filters: testFilters}
            )
        });

        const filters = getters.selectedDataFilterOptions(testState, null, testRootState, null)!!;
        expect(filters.age).toStrictEqual(testFilters.age);
        expect(filters.regions).toStrictEqual("TEST");
        expect(filters.sex).toStrictEqual(sexOptions);
        expect(filters.surveys).toBeUndefined();
    });

    it("gets null selectedDataFilters when unknown data type", () => {

        const testState = mockFilteredDataState({selectedDataType: 99 as any});
        const testRootState = mockRootState();

        const filters = getters.selectedDataFilterOptions(testState, null, testRootState, null)!;
        expect(filters).toBeNull();
    });

});