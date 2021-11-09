import {MutationTree} from "vuex";
import {PayloadWithType} from "../../types";
import {Language} from "../translations/locales";
import {RootState, TranslatableState} from "../../root";
import {RootMutation} from "../root/mutations";

export enum LanguageMutation {
    ChangeLanguage = "ChangeLanguage",
    SetUpdatingLanguage = "SetUpdatingLanguage"
}

export const mutations: MutationTree<TranslatableState> = {

    [LanguageMutation.ChangeLanguage](state: TranslatableState, action: PayloadWithType<Language>) {
        state.language = action.payload
    },

    [LanguageMutation.SetUpdatingLanguage](state: TranslatableState, action: PayloadWithType<boolean>) {
        state.updatingLanguage = action.payload;
    }
};
