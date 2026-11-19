import {localStorageManager} from "../app/localStorageManager";
import {Language} from "../app/store/translations/locales";
import registerTranslations from "../app/store/translations/registerTranslations";
import Vuex from 'vuex';
import i18next from "i18next";

describe("LocalStorageManager", () => {

    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.clearAllMocks();
    })

    it("can set and get language from local storage", () => {
        const spy = vi.spyOn(Storage.prototype, "setItem");

        localStorageManager.saveLanguage(Language.pt);

        expect(localStorageManager.getLanguage()).toBe(Language.pt)

        expect(spy.mock.calls[0][1]).toBe(Language.pt)
    });

    it("defaults to English", () => {
        expect(localStorageManager.getLanguage()).toBe(Language.en)
    });

    it("can initiate default language from store", () => {
        const store = new Vuex.Store({
            state: {language: Language.fr, updatingLanguage: false}
        });

        registerTranslations(store);
        expect(i18next.language).toBe("fr");
    });

    it("removes the working state that earlier versions kept in local storage, and nothing else", () => {
        localStorage.setItem("hintAppState_v3.14.16", "{}");
        localStorage.setItem("hintAppState_v3.2.0", "{}");
        localStorage.setItem("user", "test.user@example.com");
        localStorageManager.saveLanguage(Language.pt);

        localStorageManager.removeLegacyState();

        expect(localStorage.length).toBe(1);
        expect(localStorageManager.getLanguage()).toBe(Language.pt);
    });
});
