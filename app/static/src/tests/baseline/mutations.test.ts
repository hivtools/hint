import {mutations} from "../../app/store/baseline/mutations";
import {initialBaselineState} from "../../app/store/baseline/baseline";

describe("Baseline mutations", () => {

    it("sets country and error on PJNZLoaded", () => {

        const testState = {...initialBaselineState};
        mutations.PJNZLoaded(testState, {payload: {country: "Malawi"}, type: "PJNZLoaded"});
        expect(testState.country).toBe("Malawi");
        expect(testState.pjnzError).toBe("");
    });

    it("sets state complete once pjnz is uploaded", () => {

        const testState = {...initialBaselineState};
        mutations.PJNZLoaded(testState, {payload: {country: "Malawi"}, type: "PJNZLoaded"});
        expect(testState.complete).toBe(true);
    });

    it("sets error on PJNZUploadError", () => {

        const testState = {...initialBaselineState};
        mutations.PJNZUploadError(testState, {payload: "Some error"});
        expect(testState.pjnzError).toBe("Some error");
    })

});
