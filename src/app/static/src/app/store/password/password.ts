import {ActionTree, GetterTree, Module, ModuleTree, MutationTree, Plugin, StoreOptions} from 'vuex';
import {actions} from './actions';
import { mutations } from './mutations';
import Vuex from "vuex";
import Vue from "vue";

export interface PasswordState {
    resetLinkRequested: boolean
    error: string
}

export const initialPasswordState: PasswordState = {
    resetLinkRequested: false,
    error: ""
};

const namespaced: boolean = true;

Vue.use(Vuex);

const passwordStoreOptions: StoreOptions<PasswordState> = {
    state: initialPasswordState,
    actions,
    mutations
};

export const passwordStore = new Vuex.Store<PasswordState>(passwordStoreOptions);