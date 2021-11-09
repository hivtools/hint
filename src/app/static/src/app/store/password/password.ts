import {Error} from "../../generated";
import {TranslatableState} from "../../root";
import {Language} from "../translations/locales";

export interface PasswordState extends TranslatableState {
    resetLinkRequested: boolean
    requestResetLinkError: Error | null
    passwordWasReset: boolean
    resetPasswordError: Error | null
}

export const initialPasswordState: PasswordState = {
    language: Language.en,
    updatingLanguage: false,
    resetLinkRequested: false,
    requestResetLinkError: null,
    passwordWasReset: false,
    resetPasswordError: null
};
