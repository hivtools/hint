import Vuex from 'vuex';
import {type RootState, storeOptions} from "./root";
import registerTranslations from "./store/translations/registerTranslations";

// Main app
export const store = new Vuex.Store<RootState>(storeOptions);
registerTranslations(store);
