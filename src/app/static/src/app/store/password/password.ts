import {Error} from "../../generated";

export interface PasswordState {
    resetLinkRequested: boolean
    requestResetLinkError: Error | null
    passwordWasReset: boolean
    resetPasswordError: Error | null
}

export const initialPasswordState: PasswordState = {
    resetLinkRequested: false,
    requestResetLinkError: null,
    passwordWasReset: false,
    resetPasswordError: null
};
