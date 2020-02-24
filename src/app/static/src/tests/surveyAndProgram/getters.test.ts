import {
    DataType,
    SurveyAndProgramState
} from "../../app/store/surveyAndProgram/surveyAndProgram";
import {getters} from "../../app/store/surveyAndProgram/getters";
import {
    mockAncResponse,
    mockError,
    mockProgramResponse,
    mockSurveyAndProgramState,
    mockSurveyResponse
} from "../mocks";

describe("survey and program getters", () => {

    const getTestState = function(values: Partial<SurveyAndProgramState> = {}) {
        return mockSurveyAndProgramState(
            {
                survey: mockSurveyResponse(
                    {data: "SURVEY" as any}
                ),
                program: mockProgramResponse(
                    {data: "PROGRAM" as any}
                ),
                anc: mockAncResponse(
                    {data: "ANC" as any}
                ),
               ...values});
    };

    it("gets data when selectedDataType is Survey", () => {
        const testState = getTestState({selectedDataType: DataType.Survey});

        const data = getters.data(testState);
        expect(data).toStrictEqual("SURVEY");
    });

    it("gets data when selectedDataType is Program", () => {
        const testState = getTestState({selectedDataType: DataType.Program});

        const data = getters.data(testState);
        expect(data).toStrictEqual("PROGRAM");
    });

    it("gets data when selectedDataType is ANC", () => {
        const testState = getTestState({selectedDataType: DataType.ANC});

        const data = getters.data(testState);
        expect(data).toStrictEqual("ANC");
    });

    it("gets unfilteredData when selectedDataType is unknown", () => {
        const testState = getTestState({selectedDataType: 99 as DataType});

        const data = getters.data(testState);
        expect(data).toBeNull()
    });

    it("is not complete if missing survey", () => {
        expect(getters.complete(mockSurveyAndProgramState())).toBe(false);
    });

    it("is not complete if has a program error", () => {
        expect(getters.complete(mockSurveyAndProgramState({
            survey: mockSurveyResponse(),
            programError: mockError("something")
        }))).toBe(false);
    });

    it("is not complete if has an ANC error", () => {
        expect(getters.complete(mockSurveyAndProgramState({
            survey: mockSurveyResponse(),
            ancError: mockError("something")
        }))).toBe(false);
    });

    it("is complete if has survey and no errors", () => {
        expect(getters.complete(mockSurveyAndProgramState({
            survey: mockSurveyResponse()
        }))).toBe(true);
    });



});
