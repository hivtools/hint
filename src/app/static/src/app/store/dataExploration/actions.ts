import {LanguageActions} from "../language/language";
import {ActionTree} from "vuex";
import {DataExplorationState} from "./dataExploration";
import {LanguageMutation} from "../language/mutations";
import {changeLanguage} from "../language/actions";

export const actions: ActionTree<DataExplorationState, DataExplorationState> & LanguageActions<DataExplorationState> = {

    async changeLanguage(context, payload) {
        const {commit, dispatch, rootState} = context;

        if (rootState.language === payload) {
            return;
        }

        commit({type: LanguageMutation.SetUpdatingLanguage, payload: true});

        await changeLanguage<DataExplorationState>(context, payload);

        const actions: Promise<unknown>[] = [];

        if (rootState.baseline?.iso3) {
            actions.push(dispatch("metadata/getPlottingMetadata", rootState.baseline.iso3));
        }

        if (Object.keys(rootState.genericChart.datasets).length > 0) {
            actions.push(dispatch("genericChart/refreshDatasets"));
        }

        await Promise.all(actions);
        commit({type: LanguageMutation.SetUpdatingLanguage, payload: false});
    }

}