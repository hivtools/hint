import {surveyAndProgram, surveyAndProgramGetters} from "../../app/store/surveyAndProgram/surveyAndProgram";
import {mockError, mockSurveyAndProgramState, mockSurveyResponse} from "../mocks";

describe("survey and program getters", () => {

    it("is not complete if missing survey", () => {
        expect(surveyAndProgramGetters.complete(mockSurveyAndProgramState())).toBe(false);
    });

    it("is not complete if has a program error", () => {
        expect(surveyAndProgramGetters.complete(mockSurveyAndProgramState({
            survey: mockSurveyResponse(),
            programError: mockError("something")
        }))).toBe(false);
    });

    it("is not complete if has an ANC error", () => {
        expect(surveyAndProgramGetters.complete(mockSurveyAndProgramState({
            survey: mockSurveyResponse(),
            ancError: mockError("something")
        }))).toBe(false);
    });

    it("is complete if has survey and no errors", () => {
        expect(surveyAndProgramGetters.complete(mockSurveyAndProgramState({
            survey: mockSurveyResponse()
        }))).toBe(true);
    });

});
