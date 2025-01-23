import {ActionContext} from "vuex";
import {Language} from "../translations/locales";

export interface LanguageActions<T> {
    changeLanguage: (store: ActionContext<T, T>, lang: Language) => void;
}
