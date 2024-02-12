import {ActionContext} from "vuex";
import i18next from "i18next";
import {LanguageMutation} from "./mutations";
import {Language} from "../translations/locales";
import {TranslatableState} from "../../types";
import {RootState} from "../../root";

export async function changeLanguage<T extends TranslatableState>({commit}: ActionContext<T, T>, lang: Language) {
    await i18next.changeLanguage(lang);
    commit({type: LanguageMutation.ChangeLanguage, payload: lang})
}

export const ChangeLanguageAction = async (context: ActionContext<RootState, RootState>, payload: Language) => {

    const {commit, dispatch, rootState} = context;

    if (rootState.language === payload) {
        return;
    }

    commit({type: LanguageMutation.SetUpdatingLanguage, payload: true});

    await changeLanguage<RootState>(context, payload);

    const actions: Promise<unknown>[] = [];

    if (rootState.baseline?.iso3) {
        actions.push(dispatch("metadata/getPlottingMetadata", rootState.baseline.iso3));
    }

    if (rootState.modelCalibrate.status.done) {
        actions.push(dispatch("modelCalibrate/getResult"));
    }

    if (Object.keys(rootState.genericChart.datasets).length > 0) {
        actions.push(dispatch("genericChart/refreshDatasets"));
    }

    await Promise.all(actions);
    commit({type: LanguageMutation.SetUpdatingLanguage, payload: false});
}
