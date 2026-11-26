import Vuex from 'vuex';
import {createStoreOptions, type RootState} from "./root";
import registerTranslations from "./store/translations/registerTranslations";

// Main app. Made once the app knows who the user is (see index.ts).
export const createStore = (currentUser: string) => {
    const store = new Vuex.Store<RootState>(createStoreOptions(currentUser));
    registerTranslations(store);
    return store;
};
