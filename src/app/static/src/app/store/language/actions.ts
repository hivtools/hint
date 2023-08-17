import {ActionContext} from "vuex";
import i18next from "i18next";
import {LanguageMutation} from "./mutations";
import {Language} from "../translations/locales";
import {TranslatableState} from "../../types";
import {DataExplorationState} from "../dataExploration/dataExploration";
import {RootState} from "../../root";
import {localStorageManager} from "../../localStorageManager";

export async function changeLanguage<T>({commit}: ActionContext<T, T>, lang: Language) {
    await i18next.changeLanguage(lang);
    commit({type: LanguageMutation.ChangeLanguage, payload: lang})
}

function isRoot(object: DataExplorationState): object is RootState {
    return !object.dataExplorationMode
}

export const ChangeLanguageAction = async (context: ActionContext<DataExplorationState, DataExplorationState>, payload: Language) => {

    const {commit, dispatch, rootState} = context;

    if (localStorageManager.getLanguageState() === payload) {
        return;
    }

    commit({type: LanguageMutation.SetUpdatingLanguage, payload: true});

    await changeLanguage<DataExplorationState>(context, payload);

    const actions: Promise<unknown>[] = [];

    if (rootState.baseline?.iso3) {
        actions.push(dispatch("metadata/getPlottingMetadata", rootState.baseline.iso3));
    }

    if (isRoot(rootState) && rootState.modelCalibrate.status.done) {
        actions.push(dispatch("modelCalibrate/getResult"));
    }

    if (Object.keys(rootState.genericChart.datasets).length > 0) {
        actions.push(dispatch("genericChart/refreshDatasets"));
    }

    await Promise.all(actions);
    commit({type: LanguageMutation.SetUpdatingLanguage, payload: false});
}
