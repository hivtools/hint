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

    it("sets surveys data and filename and clears error on SurveyUpdated", () => {
        const testState = {...initialSurveyAndProgramDataState, surveyError: "test"};
        mutations.SurveyUpdated(testState, testPayload);
        expect(testState.survey!!.data).toStrictEqual(testData);
        expect(testState.survey!!.filename).toBe("somefile.csv");
        expect(testState.surveyError).toBe("");
    });

    it("sets error on SurveyError", () => {
        const testState = {...initialSurveyAndProgramDataState};
        mutations.SurveyError(testState, {payload: "Some error"});
        expect(testState.surveyError).toBe("Some error");
    });

    it("sets program data and filename and clears error on ProgramUpdated", () => {
        const testState = {...initialSurveyAndProgramDataState, programError: "test"};
        mutations.ProgramUpdated(testState, testPayload);
        expect(testState.program!!.data).toStrictEqual(testData);
        expect(testState.program!!.filename).toBe("somefile.csv");
        expect(testState.programError).toBe("");
    });

    it("sets error on ProgramError", () => {
        const testState = {...initialSurveyAndProgramDataState};
        mutations.ProgramError(testState, {payload: "Some error"});
        expect(testState.programError).toBe("Some error");
    });

    it("sets anc data and filename and clears error on ANCUpdated", () => {
        const testState = {...initialSurveyAndProgramDataState, ancError: "test"};
        mutations.ANCUpdated(testState, testPayload);
        expect(testState.anc!!.data).toStrictEqual(testData);
        expect(testState.anc!!.filename).toBe("somefile.csv");
        expect(testState.ancError).toBe("");
    });

    it("sets error on ANCError", () => {
        const testState = {...initialSurveyAndProgramDataState};
        mutations.ANCError(testState, {payload: "Some error"});
        expect(testState.ancError).toBe("Some error");
    });

    it("finds complete is true after all files are upUpdated", () => {
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

        mutations.SurveyUpdated(testState, testPayload);
        expect(complete(testState, null, testRootState, null)).toBe(false);

        mutations.ProgramUpdated(testState, testPayload);
        expect(complete(testState, null, testRootState, null)).toBe(false);

        mutations.ANCUpdated(testState, testPayload);
        expect(complete(testState, null, testRootState, null)).toBe(true);
    });

});
