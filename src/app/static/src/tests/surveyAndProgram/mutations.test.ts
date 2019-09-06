import {
    initialSurveyAndProgramDataState,
    SurveyAndProgramDataState, surveyAndProgramGetters
} from "../../app/store/surveyAndProgram/surveyAndProgram";
import {mutations} from "../../app/store/surveyAndProgram/mutations";
import { mockSurveyResponse} from "../mocks";
import {initialBaselineState} from "../../app/store/baseline/baseline";
import {Module} from "vuex";
import {RootState} from "../../app/root";
import {initialFilteredDataState} from "../../app/store/filteredData/filteredData";

describe("Survey and program mutations", () => {

    const testPayload = {
        payload: mockSurveyResponse({
            data: [],
            filename: "somefile.csv"
        })
    };

    it("sets survey data and filename on SurveyLoaded", () => {
        const testState = {...initialSurveyAndProgramDataState};
        mutations.SurveyLoaded(testState, testPayload);
        expect(testState.survey!!.data.length).toBe(0);
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
        expect(testState.program!!.data.length).toBe(0);
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
        expect(testState.anc!!.data.length).toBe(0);
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
        const testRootState = {
            version: "",
            filteredData: {...initialFilteredDataState},
            baseline: {...initialBaselineState},
            surveyAndProgram: testState,
        };
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
