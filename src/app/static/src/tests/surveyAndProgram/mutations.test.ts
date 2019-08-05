import {initialSurveyAndProgramDataState} from "../../app/store/surveyAndProgram/surveyAndProgram";
import {mutations} from "../../app/store/surveyAndProgram/mutations";

describe("Survey and program mutations", () => {

    it("sets survey geoson on SurveyLoaded", () => {

        const testState = {...initialSurveyAndProgramDataState};
        mutations.SurveyLoaded(testState, {payload: "somegeojson"});
        expect(testState.surveyGeoJson).toBe("somegeojson");
        expect(testState.surveyError).toBe("");
    });

    it("sets error on SurveyError", () => {

        const testState = {...initialSurveyAndProgramDataState};
        mutations.SurveyError(testState, {payload: "Some error"});
        expect(testState.surveyError).toBe("Some error");
    })

});
