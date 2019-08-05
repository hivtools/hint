import {mutations} from "../../app/store/baseline/mutations";
import {initialBaselineState} from "../../app/store/baseline/baseline";

describe("Baseline mutations", () => {

    it("sets country and error on PJNZLoaded", () => {

        const testState = {...initialBaselineState};
        mutations.PJNZLoaded(testState, {payload: {country: "Malawi"}, type: "PJNZLoaded"});
        expect(testState.country).toBe("Malawi");
        expect(testState.pjnzError).toBe("");
    });

    it("sets error on PJNZUploadError", () => {

        const testState = {...initialBaselineState};
        mutations.PJNZUploadError(testState, {payload: "Some error"});
        expect(testState.pjnzError).toBe("Some error");
    });

    it("sets country and filename if present on BaselineDataLoaded", () => {

        const testState = {...initialBaselineState};
        mutations.BaselineDataLoaded(testState, {payload: {pjnz: {filename: "file.pjnz", country: "Malawi"}}});
        expect(testState.pjnzFilename).toBe("file.pjnz");
        expect(testState.country).toBe("Malawi");
    });

    it("does nothing on BaselineDataLoaded if no data present", () => {

        const testState = {...initialBaselineState};
        mutations.BaselineDataLoaded(testState, {payload: {pjnz: null}});
        expect(testState.pjnzFilename).toBe("");
        expect(testState.country).toBe("");
    });

});
