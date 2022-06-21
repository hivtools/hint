import {Error} from "../../generated";
import {Language} from "../translations/locales";
import {TranslatableState} from "../../types";

export interface LoginState extends TranslatableState {
    loginRequested: boolean
    loginRequestError: Error | null
    // passwordWasReset: boolean
    // resetPasswordError: Error | null
}

export const initialLoginState: LoginState = {
    language: Language.en,
    updatingLanguage: false,
    loginRequested: false,
    loginRequestError: null,
    // passwordWasReset: false,
    // resetPasswordError: null
};
