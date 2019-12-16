import {ActionContext, ActionTree} from "vuex";
import i18next from "i18next";
import {TranslatableState} from "../../root";
import {LanguageMutation} from "./mutations";

export interface LanguageActions<T extends TranslatableState> {
    changeLanguage: (store: ActionContext<T, T>, lang: string) => void;
}

export function actions<T extends TranslatableState>(): ActionTree<T, T> & LanguageActions<T>{

    return {
        async changeLanguage({commit}, lang) {
            await i18next.changeLanguage(lang);
            commit({type: LanguageMutation.ChangeLanguage, payload: lang})
        }
    }
}
