import {Module} from 'vuex';
import {actions} from './actions';
import { mutations } from './mutations';
import {RootState} from "../../main";

export interface PasswordState {
    resetLinkRequested: boolean
    requestResetLinkError: string
}

export const initialPasswordState: PasswordState = {
    resetLinkRequested: false,
    requestResetLinkError: ""
};

const namespaced: boolean = true;

export const password: Module<PasswordState, RootState> = {
    namespaced,
    state: initialPasswordState,
    getters: {},
    actions,
    mutations
};