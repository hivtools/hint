
export interface PasswordState {
    resetLinkRequested: boolean
    requestResetLinkError: string
}

export const initialPasswordState: PasswordState = {
    resetLinkRequested: false,
    requestResetLinkError: ""
};
