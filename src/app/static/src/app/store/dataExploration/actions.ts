import {LanguageActions} from "../language/language";
import {ActionContext, ActionTree} from "vuex";
import {DataExplorationState} from "./dataExploration";
import {ChangeLanguageAction} from "../language/actions";
import {ErrorReportManualDetails} from "../../types";
import {currentHintVersion} from "../../hintVersion";
import {VersionInfo} from "../../generated";
import {ErrorsMutation} from "../errors/mutations";
import {api} from "../../apiService";

export interface DataExplorationActions extends LanguageActions<DataExplorationState> {
    generateErrorReport: (store: ActionContext<DataExplorationState, DataExplorationState>,
                          payload: ErrorReportManualDetails) => void;
}

export const actions: ActionTree<DataExplorationState, DataExplorationState> & DataExplorationActions = {

    async changeLanguage(context, payload) {
        await ChangeLanguageAction(context, payload)
    },

    async generateErrorReport(context, payload) {
        const {rootState, getters, commit} = context
        const data = {
            email: payload.email || rootState.currentUser,
            country: rootState.baseline.country || "no associated country",
            projectName: "no associated project",
            browserAgent: navigator.userAgent,
            timeStamp: new Date().toISOString(),
            modelRunId: "no associated modelRunId",
            description: payload.description,
            section: payload.section,
            stepsToReproduce: payload.stepsToReproduce,
            versions: {hint: currentHintVersion, ...rootState.hintrVersion.hintrVersion as VersionInfo},
            errors: getters.errors
        }
        commit({type: `errors/${ErrorsMutation.SendingErrorReport}`, payload: true});
        await api<ErrorsMutation, ErrorsMutation>(context)
            .withSuccess(`errors/${ErrorsMutation.ErrorReportSuccess}` as ErrorsMutation)
            .withError(`errors/${ErrorsMutation.ErrorReportError}` as ErrorsMutation)
            .postAndReturn("error-report", data)

        commit({type: `errors/${ErrorsMutation.SendingErrorReport}`, payload: false});
    }
}
