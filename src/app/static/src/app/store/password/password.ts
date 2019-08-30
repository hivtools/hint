
export interface PasswordState {
    resetLinkRequested: boolean
    requestResetLinkError: string
    passwordWasReset: boolean
    resetPasswordError: string
}

export const initialPasswordState: PasswordState = {
    resetLinkRequested: false,
    requestResetLinkError: "",
    passwordWasReset: false,
    resetPasswordError: ""
};
