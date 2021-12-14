import {LanguageActions} from "../language/language";
import {ActionTree} from "vuex";
import {DataExplorationState} from "./dataExploration";
import {ChangeLanguageAction} from "../language/actions";

export const actions: ActionTree<DataExplorationState, DataExplorationState> & LanguageActions<DataExplorationState> = {

    async changeLanguage(context, payload) {
        await ChangeLanguageAction(context, payload)
    }

}