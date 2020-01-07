import Vue from 'vue';
import Vuex from 'vuex';
import {RootState, storeOptions} from "./root";
import registerTranslations from "./store/translations/registerTranslations";

Vue.use(Vuex);

export const store = new Vuex.Store<RootState>(storeOptions);
registerTranslations(store);

export const inactiveFeatures: string[] = ["BubblePlot"];
