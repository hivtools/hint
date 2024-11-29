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

    const {commit, dispatch, rootState, rootGetters} = context;

    if (rootState.language === payload) {
        return;
    }

    commit({type: LanguageMutation.SetUpdatingLanguage, payload: true});

    await changeLanguage<RootState>(context, payload);

    const actions: Promise<unknown>[] = [];

    if (rootState.reviewInput.population.data !== null && rootGetters["baseline/complete"]) {
        actions.push(dispatch("reviewInput/getPopulationDataset"));
    }

    // Re-fetch input comparison data to get translated metadata if the data has previously been fetched
    if (rootState.reviewInput.inputComparison.data !== null && rootGetters["baseline/complete"] && rootGetters["surveyAndProgram/complete"]) {
        actions.push(dispatch("reviewInput/getInputComparisonDataset"));
    }

    if (rootState.modelCalibrate.status.done) {
        actions.push(dispatch("modelCalibrate/getResult"));
    }

    if (Object.keys(rootState.reviewInput.datasets).length > 0) {
        actions.push(dispatch("reviewInput/refreshDatasets"));
    }

    await Promise.all(actions);
    commit({type: LanguageMutation.SetUpdatingLanguage, payload: false});
}
