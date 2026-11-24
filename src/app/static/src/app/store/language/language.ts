import type {ActionContext} from "vuex";
import type {Language} from "../translations/locales";

export interface LanguageActions<T> {
    changeLanguage: (store: ActionContext<T, T>, lang: Language) => void;
}
