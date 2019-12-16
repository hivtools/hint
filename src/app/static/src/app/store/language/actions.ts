import {ActionContext} from "vuex";
import i18next from "i18next";
import {TranslatableState} from "../../root";
import {LanguageMutation} from "./mutations";
import {Language} from "../translations/locales";

export async function changeLanguage<T extends TranslatableState>({commit}: ActionContext<T, T>, lang: Language) {
    await i18next.changeLanguage(lang);
    commit({type: LanguageMutation.ChangeLanguage, payload: lang})
}
