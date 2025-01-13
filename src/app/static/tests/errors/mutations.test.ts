import {mutations} from "../../src/store/errors/mutations";
import {mockError, mockErrorsState} from "../mocks";

describe("Errors mutations", () => {
    it("ErrorAdded adds error", () => {
        const firstError = mockError("first error");
        const secondError = mockError("second error");
        const testState = {
            errors: [firstError],
            errorReportError: null,
            errorReportSuccess: false,
            sendingErrorReport: false
        };
        mutations.ErrorAdded(testState, {type: mutations.ErrorAdded, payload: secondError});
        expect(testState.errors).toStrictEqual([firstError, secondError]);
    });

    it("DismissAll clears errors", () => {
        const testState = {
            errors: [mockError("First Error")],
            errorReportError: null,
            errorReportSuccess: false,
            sendingErrorReport: false
        };
        mutations.DismissAll(testState, null);
        expect(testState.errors).toStrictEqual([]);
    });

    it("can set ErrorReportError", () => {
        const error = mockError("Error");
        const state = mockErrorsState();
        mutations.ErrorReportError(state, {payload: error});
        expect(state.errorReportError).toBe(error);
        expect(state.errorReportSuccess).toBe(false);
    });

    it("can set ErrorReportSuccess", () => {
        const state = mockErrorsState();
        mutations.ErrorReportSuccess(state);
        expect(state.errorReportSuccess).toBe(true);
        expect(state.errorReportError).toBe(null);
    });

    it("can set SendingErrorReport", () => {
        const state = mockErrorsState();
        mutations.SendingErrorReport(state, {payload: true});
        expect(state.sendingErrorReport).toBe(true);
    });
});
