import {ActionContext, ActionTree} from "vuex";
import {RootState} from "../../root";
import {LanguageActions} from "../language/language";
import {changeLanguage} from "../language/actions";
import {api} from "../../apiService";
import {VersionInfo} from "../../generated";
import {currentHintVersion} from "../../hintVersion";
import {DataExplorationState} from "./dataExploration";
import {ErrorReportManualDetails} from "../../types";
import {LanguageMutation} from "../language/mutations";
import {DataExplorationMutation} from "./mutations";

export interface DataExplorationActions extends LanguageActions<DataExplorationState> {
    generateErrorReport: (store: ActionContext<DataExplorationState, DataExplorationState>,
                          payload: ErrorReportManualDetails) => void;
}

export const actions: ActionTree<DataExplorationState, DataExplorationState> & DataExplorationActions = {

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

        await Promise.all(actions);
        commit({type: LanguageMutation.SetUpdatingLanguage, payload: false});
    },

    async generateErrorReport(context, payload) {
        const {dispatch, rootState, getters} = context
        const data = {
            email: payload.email || rootState.currentUser,
            country: rootState.baseline.country || "no associated country",
            projectName: "data exploration mode",
            browserAgent: navigator.userAgent,
            timeStamp: new Date().toISOString(),
            jobId: "data exploration mode",
            description: payload.description,
            section: "data exploration mode",
            stepsToReproduce: payload.stepsToReproduce,
            versions: {hint: currentHintVersion, ...rootState.hintrVersion.hintrVersion as VersionInfo},
            errors: getters.errors
        }

        await api<DataExplorationMutation, DataExplorationMutation>(context)
            .withSuccess(DataExplorationMutation.ErrorReportSuccess)
            .withError(DataExplorationMutation.ErrorReportError)
            .postAndReturn("error-report", data)
    }
};
