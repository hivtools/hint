import {mutations} from "../../app/store/password/mutations";
import {initialPasswordState} from "../../app/store/password/password";

describe("Password mutations", () => {

    it("sets resetLinkRequested on success", () => {

        const testState = {...initialPasswordState};
        mutations.ResetLinkRequested(testState, {payload: null});
        expect(testState.resetLinkRequested).toBe(true);
        expect(testState.requestResetLinkError).toBe("");
    });

    it("sets error on RequestResetLinkError", () => {

        const testState = {...initialPasswordState};
        mutations.RequestResetLinkError(testState, {payload: "test error"});
        expect(testState.resetLinkRequested).toBe(false);
        expect(testState.requestResetLinkError).toBe("test error");
    });

    it("sets passwordWasReset on success", () => {

        const testState = {...initialPasswordState};
        mutations.ResetPassword(testState, {payload: null});
        expect(testState.passwordWasReset).toBe(true);
        expect(testState.resetPasswordError).toBe("");
    });

    it("sets error on ResetPasswordError", () => {

        const testState = {...initialPasswordState};
        mutations.ResetPasswordError(testState, {payload: "test error"});
        expect(testState.passwordWasReset).toBe(false);
        expect(testState.resetPasswordError).toBe("test error");
    });

});
