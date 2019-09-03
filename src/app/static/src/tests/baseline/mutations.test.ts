import {mutations} from "../../app/store/baseline/mutations";
import {initialBaselineState} from "../../app/store/baseline/baseline";
import {mockBaselineResponse, mockPJNZResponse} from "../mocks";

describe("Baseline mutations", () => {

    it("sets country, filename and error on PJNZLoaded", () => {

        const testState = {...initialBaselineState};
        mutations.PJNZUploaded(testState, {
            payload: mockPJNZResponse({data: {country: "Malawi"}, filename: "file.pjnz"}),
            type: "PJNZLoaded"
        });
        expect(testState.country).toBe("Malawi");
        expect(testState.pjnzFilename).toBe("file.pjnz");
        expect(testState.pjnzError).toBe("");
    });

    it("sets state complete once pjnz is uploaded", () => {

        const testState = {...initialBaselineState};
        mutations.PJNZUploaded(testState, {payload: mockPJNZResponse({data: {country: "Malawi"}}), type: "PJNZLoaded"});
        expect(testState.complete()).toBe(true);
    });

    it("sets error on PJNZUploadError", () => {

        const testState = {...initialBaselineState};
        mutations.PJNZUploadError(testState, {payload: "Some error"});
        expect(testState.pjnzError).toBe("Some error");
    });

    it("sets country and filename if present on BaselineDataLoaded", () => {

        const testState = {...initialBaselineState};
        mutations.BaselineDataLoaded(testState, {
            payload: mockBaselineResponse({
                pjnz: mockPJNZResponse({filename: "file.pjnz", data: {country: "Malawi"}})
            })
        });
        expect(testState.pjnzFilename).toBe("file.pjnz");
        expect(testState.country).toBe("Malawi");
    });

    it("does nothing on BaselineDataLoaded if no data present", () => {

        const testState = {...initialBaselineState};
        mutations.BaselineDataLoaded(testState, {payload: mockBaselineResponse({pjnz: null})});
        expect(testState.pjnzFilename).toBe("");
        expect(testState.country).toBe("");
    });

});
