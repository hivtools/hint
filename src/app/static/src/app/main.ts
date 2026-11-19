import Vuex from 'vuex';
import {RootState, storeOptions} from "./root";
import registerTranslations from "./store/translations/registerTranslations";

// Main app
export const store = new Vuex.Store<RootState>(storeOptions);
registerTranslations(store);
