import Vue from 'vue';
import Vuex from 'vuex';
import {RootState, storeOptions} from "./root";

Vue.use(Vuex);

export const store = new Vuex.Store<RootState>(storeOptions);
