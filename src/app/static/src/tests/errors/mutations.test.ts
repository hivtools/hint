import {mutations} from "../../app/store/errors/mutations";
import {ErrorsState} from "../../app/store/errors/errors";
import {mockError} from "../mocks";
import {Error} from "../../app/generated";

describe("Errors mutations", () => {
    it("ErrorAdded adds error", () => {
        const firstError = mockError("first error");
        const secondError = mockError("second error");
        const testState = { errors:[firstError] };
        mutations.ErrorAdded(testState, {type:  mutations.ErrorAdded, payload: secondError});
        expect(testState.errors).toStrictEqual([firstError, secondError]);
    });

    it("DismissAll clears errors", () => {
        const testState = { errors:[mockError("First Error")] };
        mutations.DismissAll(testState, null);
        expect(testState.errors).toStrictEqual([]);
    });
});