import {Error} from "../../generated";
import {Language} from "../translations/locales";
import {TranslatableState} from "../../types";

export interface PasswordState extends TranslatableState {
    resetLinkRequested: boolean
    requestResetLinkError: Error | null
    passwordWasReset: boolean
    resetPasswordError: Error | null
}

export const initialPasswordState: PasswordState = {
    language: Language.en,
    resetLinkRequested: false,
    requestResetLinkError: null,
    passwordWasReset: false,
    resetPasswordError: null
};
