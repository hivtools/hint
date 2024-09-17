import {getters} from "../../app/store/surveyAndProgram/getters";
import {mockAncResponse, mockError, mockProgramResponse, mockSurveyAndProgramState, mockSurveyResponse} from "../mocks";

describe("survey and program getters", () => {

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

    it("has changes if has changes to either survey or program or anc", () => {
        expect(getters.hasChanges(mockSurveyAndProgramState({
            survey: mockSurveyResponse()
        }))).toBe(true);
        expect(getters.hasChanges(mockSurveyAndProgramState({
            program: mockProgramResponse()
        }))).toBe(true);
        expect(getters.hasChanges(mockSurveyAndProgramState({
            anc: mockAncResponse()
        }))).toBe(true);
    });
});
