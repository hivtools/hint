import {mutations} from "../../app/store/baseline/mutations";
import {mockPJNZResponse} from "../mocks";
import {baselineGetters, BaselineState, initialBaselineState} from "../../app/store/baseline/baseline";
import {initialSurveyAndProgramDataState} from "../../app/store/surveyAndProgram/surveyAndProgram";
import {Module} from "vuex";
import {RootState} from "../../app/main";

describe("Baseline mutations", () => {

    it("sets country, filename and error on PJNZUploaded", () => {

        const testState = {...initialBaselineState};
        mutations.PJNZUploaded(testState, {
            payload: mockPJNZResponse({data: {country: "Malawi"}, filename: "file.pjnz"})
        });
        expect(testState.country).toBe("Malawi");
        expect(testState.pjnzFilename).toBe("file.pjnz");
        expect(testState.pjnzError).toBe("");
    });

    it("state becomes complete once pjnz is uploaded", () => {
        const testStore: Module<BaselineState, RootState> = {
            state: {...initialBaselineState},
            getters: baselineGetters
        };
        const testState = testStore.state as BaselineState;
        const testRootState = {
            version: "",
            baseline: testState,
            surveyAndProgram: {...initialSurveyAndProgramDataState}
        };
        const complete = testStore.getters!!.complete;

        mutations.PJNZUploaded(testState, {payload: mockPJNZResponse({data: {country: "Malawi"}}), type: "PJNZLoaded"});

        expect(complete(testState, null, testRootState, null)).toBe(true);
    });

    it("sets error on PJNZUploadError", () => {

        const testState = {...initialBaselineState};
        mutations.PJNZUploadError(testState, {payload: "Some error"});
        expect(testState.pjnzError).toBe("Some error");
    });

    it("sets country and filename if present on PJNZLoaded", () => {

        const testState = {...initialBaselineState};
        mutations.PJNZLoaded(testState, {
            payload: mockPJNZResponse({filename: "file.pjnz", data: {country: "Malawi"}})
        });
        expect(testState.pjnzFilename).toBe("file.pjnz");
        expect(testState.country).toBe("Malawi");
    });

    it("does nothing on BaselineDataLoaded if no data present", () => {

        const testState = {...initialBaselineState};
        mutations.PJNZLoaded(testState, {payload: null});
        expect(testState.pjnzFilename).toBe("");
        expect(testState.country).toBe("");
    });

});
