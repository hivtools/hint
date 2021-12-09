import {LanguageActions} from "../language/language";
import {ActionTree} from "vuex";
import {DataExplorationState} from "./dataExploration";
import {ChangeLanguageHelper} from "../../utils";

export const actions: ActionTree<DataExplorationState, DataExplorationState> & LanguageActions<DataExplorationState> = {

    async changeLanguage(context, payload) {
        await ChangeLanguageHelper(context, payload)
    }

}