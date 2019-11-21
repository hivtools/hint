import {SurveyAndProgramDataState, surveyAndProgramGetters} from "../../app/store/surveyAndProgram/surveyAndProgram";
import {mutations, SurveyAndProgramMutation} from "../../app/store/surveyAndProgram/mutations";
import {mockRootState, mockSurveyAndProgramState, mockSurveyResponse} from "../mocks";

import {Module} from "vuex";
import {RootState} from "../../app/root";

describe("Survey and programme mutations", () => {

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
        const testState = mockSurveyAndProgramState({surveyError: "test"});
        mutations[SurveyAndProgramMutation.SurveyUpdated](testState, testPayload);
        expect(testState.survey!!.data).toStrictEqual(testData);
        expect(testState.survey!!.filename).toBe("somefile.csv");
        expect(testState.surveyError).toBe("");
    });

    it("sets error on SurveyError", () => {
        const testState = mockSurveyAndProgramState();
        mutations[SurveyAndProgramMutation.SurveyError](testState, {payload: "Some error"});
        expect(testState.surveyError).toBe("Some error");
    });

    it("sets programme data and filename and clears error on ProgramUpdated", () => {
        const testState = mockSurveyAndProgramState({programError: "test"});
        mutations[SurveyAndProgramMutation.ProgramUpdated](testState, testPayload);

        expect(testState.program!!.data).toStrictEqual(testData);
        expect(testState.program!!.filename).toBe("somefile.csv");
        expect(testState.programError).toBe("");
    });

    it("sets error on ProgramError", () => {
        const testState = mockSurveyAndProgramState();

        mutations[SurveyAndProgramMutation.ProgramError](testState, {payload: "Some error"});
        expect(testState.programError).toBe("Some error");
    });

    it("sets anc data and filename and clears error on ANCUpdated", () => {
        const testState = mockSurveyAndProgramState({ancError: "test"});
        mutations[SurveyAndProgramMutation.ANCUpdated](testState, testPayload);
        expect(testState.anc!!.data).toStrictEqual(testData);
        expect(testState.anc!!.filename).toBe("somefile.csv");
        expect(testState.ancError).toBe("");
    });

    it("sets error on ANCError", () => {
        const testState = mockSurveyAndProgramState();
        mutations[SurveyAndProgramMutation.ANCError](testState, {payload: "Some error"});
        expect(testState.ancError).toBe("Some error");
    });

    it("is complete once survey file is present", () => {
        const testStore: Module<SurveyAndProgramDataState, RootState> = {
            state: mockSurveyAndProgramState(),
            getters: surveyAndProgramGetters
        };
        const testState = testStore.state as SurveyAndProgramDataState;
        const testRootState = mockRootState({surveyAndProgram: testState});

        const complete = testStore.getters!!.complete;

        expect(complete(testState, null, testRootState, null)).toBe(false);

        mutations[SurveyAndProgramMutation.SurveyUpdated](testState, testPayload);
        expect(complete(testState, null, testRootState, null)).toBe(true);
    });

    it("sets ready state", () => {
        const testState = mockSurveyAndProgramState();
        mutations.Ready(testState);
        expect(testState.ready).toBe(true);
    });

});
