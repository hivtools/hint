import Vue from 'vue';
import Vuex from 'vuex';
import {RootState, storeOptions} from "./root";
import init from "./store/translations/init";
Vue.use(Vuex);

export const store = new Vuex.Store<RootState>(storeOptions);
init(store);
