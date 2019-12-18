import {MutationTree} from "vuex";
import {PayloadWithType} from "../../types";
import {Language} from "../translations/locales";
import {TranslatableState} from "../../root";

export enum LanguageMutation {
    ChangeLanguage = "ChangeLanguage"
}

export const mutations: MutationTree<TranslatableState> = {

    [LanguageMutation.ChangeLanguage](state: TranslatableState, action: PayloadWithType<Language>) {
        state.language = action.payload
    }
};
