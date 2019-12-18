import {mutations} from "../../app/store/password/mutations";
import {initialPasswordState} from "../../app/store/password/password";
import {mockError, mockPasswordState} from "../mocks";
import {LanguageMutation} from "../../app/store/language/mutations";

describe("Password mutations", () => {

    it("sets resetLinkRequested on success", () => {

        const testState = {...initialPasswordState};
        mutations.ResetLinkRequested(testState, {payload: null});
        expect(testState.resetLinkRequested).toBe(true);
        expect(testState.requestResetLinkError).toBe(null);
    });

    it("sets error on RequestResetLinkError", () => {
        const error = mockError("test error");
        const testState = {...initialPasswordState};
        mutations.RequestResetLinkError(testState, {payload: error});
        expect(testState.resetLinkRequested).toBe(false);
        expect(testState.requestResetLinkError).toBe(error);
    });

    it("sets passwordWasReset on success", () => {

        const testState = {...initialPasswordState};
        mutations.ResetPassword(testState, {payload: null});
        expect(testState.passwordWasReset).toBe(true);
        expect(testState.resetPasswordError).toBe(null);
    });

    it("sets error on ResetPasswordError", () => {

        const testState = {...initialPasswordState};
        const error = mockError("test error");
        mutations.ResetPasswordError(testState, {payload: error});
        expect(testState.passwordWasReset).toBe(false);
        expect(testState.resetPasswordError).toBe(error);
    });

    it("can change language", () => {
        const state = mockPasswordState();
        mutations[LanguageMutation.ChangeLanguage](state, {payload: "fr"});
        expect(state.language).toBe("fr");
    });

});

