import {initialSurveyAndProgramDataState} from "../../app/store/surveyAndProgram/surveyAndProgram";
import {mutations} from "../../app/store/surveyAndProgram/mutations";
import {mockShapeResponse} from "../mocks";

describe("Survey and program mutations", () => {

    const testPayload = {
        payload: mockShapeResponse({
            data: "somegeojson" as any,
            filename: "somefile.csv"
        })
    };

    it("sets survey geoson and filename on SurveyLoaded", () => {
        const testState = {...initialSurveyAndProgramDataState};
        mutations.SurveyLoaded(testState, testPayload);
        expect(testState.survey!!.data).toBe("somegeojson");
        expect(testState.survey!!.filename).toBe("somefile.csv");
        expect(testState.surveyError).toBe("");
    });

    it("sets error on SurveyError", () => {
        const testState = {...initialSurveyAndProgramDataState};
        mutations.SurveyError(testState, {payload: "Some error"});
        expect(testState.surveyError).toBe("Some error");
    });

    it("sets program geoson and filename on ProgramLoaded", () => {
        const testState = {...initialSurveyAndProgramDataState};
        mutations.ProgramLoaded(testState, testPayload);
        expect(testState.program!!.data).toBe("somegeojson");
        expect(testState.program!!.filename).toBe("somefile.csv");
        expect(testState.programError).toBe("");
    });

    it("sets error on ProgramError", () => {
        const testState = {...initialSurveyAndProgramDataState};
        mutations.ProgramError(testState, {payload: "Some error"});
        expect(testState.programError).toBe("Some error");
    });

});
