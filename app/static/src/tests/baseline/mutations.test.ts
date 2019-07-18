import {mutations} from "../../app/store/baseline/mutations";
import {initialBaselineState} from "../../app/store/baseline/baseline";

describe("Baseline mutations", () => {

    it("sets country and error on PJNZLoaded", () => {

        const testState = {...initialBaselineState};
        mutations.PJNZLoaded(testState, {payload: {country: "Malawi"}, type: "PJNZLoaded"});
        expect(testState.country).toBe("Malawi");
        expect(testState.hasError).toBe(false);
    });

    it("sets error on PJNZUploadError", () => {

        const testState = {...initialBaselineState};
        mutations.PJNZLoadError(testState);
        expect(testState.hasError).toBe(true);
    })

});
