import {
    initialSurveyAndProgramDataState,
    SurveyAndProgramDataState, surveyAndProgramGetters
} from "../../app/store/surveyAndProgram/surveyAndProgram";
import {mutations} from "../../app/store/surveyAndProgram/mutations";
import {mockModelRunState, mockRootState, mockSurveyResponse} from "../mocks";
import {Module} from "vuex";
import {RootState} from "../../app/root";

describe("Survey and program mutations", () => {

    const testData = [{
        iso3: "MWI",
        area_id: "MWI.1",
        survey_id: "MWI1"
    }];

    const testPayload = {
        payload: mockSurveyResponse({
            data: testData,
            filename: "somefile.csv"
        })
    };

    it("sets surveys data and filename on SurveyLoaded", () => {
        const testState = {...initialSurveyAndProgramDataState};
        mutations.SurveyLoaded(testState, testPayload);
        expect(testState.survey!!.data).toStrictEqual(testData);
        expect(testState.survey!!.filename).toBe("somefile.csv");
        expect(testState.surveyError).toBe("");
    });

    it("sets error on SurveyError", () => {
        const testState = {...initialSurveyAndProgramDataState};
        mutations.SurveyError(testState, {payload: "Some error"});
        expect(testState.surveyError).toBe("Some error");
    });

    it("sets program data and filename on ProgramLoaded", () => {
        const testState = {...initialSurveyAndProgramDataState};
        mutations.ProgramLoaded(testState, testPayload);
        expect(testState.program!!.data).toStrictEqual(testData);
        expect(testState.program!!.filename).toBe("somefile.csv");
        expect(testState.programError).toBe("");
    });

    it("sets error on ProgramError", () => {
        const testState = {...initialSurveyAndProgramDataState};
        mutations.ProgramError(testState, {payload: "Some error"});
        expect(testState.programError).toBe("Some error");
    });

    it("sets anc data and filename on ANCLoaded", () => {
        const testState = {...initialSurveyAndProgramDataState};
        mutations.ANCLoaded(testState, testPayload);
        expect(testState.anc!!.data).toStrictEqual(testData);
        expect(testState.anc!!.filename).toBe("somefile.csv");
        expect(testState.ancError).toBe("");
    });

    it("sets error on ANCError", () => {
        const testState = {...initialSurveyAndProgramDataState};
        mutations.ANCError(testState, {payload: "Some error"});
        expect(testState.ancError).toBe("Some error");
    });

    it("finds complete is true after all files are uploaded", () => {
        const testStore:  Module<SurveyAndProgramDataState, RootState> = {
            state: {...initialSurveyAndProgramDataState},
            getters: surveyAndProgramGetters
        };
        const testState = testStore.state as SurveyAndProgramDataState;
        const testRootState = mockRootState({surveyAndProgram: testState});
        const complete = testStore.getters!!.complete;

        expect(complete(testState, null, testRootState, null)).toBe(false);

        mutations.SurveyLoaded(testState, testPayload);
        expect(complete(testState, null, testRootState, null)).toBe(false);

        mutations.ProgramLoaded(testState, testPayload);
        expect(complete(testState, null, testRootState, null)).toBe(false);

        mutations.ANCLoaded(testState, testPayload);
        expect(complete(testState, null, testRootState, null)).toBe(true);
    });

});
