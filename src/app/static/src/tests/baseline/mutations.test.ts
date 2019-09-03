import {mutations} from "../../app/store/baseline/mutations";
import {initialBaselineState} from "../../app/store/baseline/baseline";
import {mockPJNZResponse, mockShapeResponse} from "../mocks";

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

    it("sets state complete once pjnz is uploaded", () => {

        const testState = {...initialBaselineState};
        mutations.PJNZUploaded(testState, {payload: mockPJNZResponse({data: {country: "Malawi"}}), type: "PJNZLoaded"});
        expect(testState.complete).toBe(true);
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

    it("does nothing on PJNZLoaded if no data present", () => {

        const testState = {...initialBaselineState};
        mutations.PJNZLoaded(testState, {payload: null});
        expect(testState.pjnzFilename).toBe("");
        expect(testState.country).toBe("");
    });

    it("sets shape on ShapeLoaded", () => {

        const mockShape = mockShapeResponse();
        const testState = {...initialBaselineState};
        mutations.ShapeUploaded(testState, {
            payload: mockShape
        });
        expect(testState.shape).toBe(mockShape);
    });

    it("sets error on ShapeUploadError", () => {

        const testState = {...initialBaselineState};
        mutations.ShapeUploadError(testState, {payload: "Some error"});
        expect(testState.shapeError).toBe("Some error");
    });

});
