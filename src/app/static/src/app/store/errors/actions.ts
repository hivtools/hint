import {ActionContext, ActionTree} from "vuex";
import {RootState} from "../../root";
import {ErrorsMutation} from "./mutations";
import {ErrorsState} from "./errors";
import {api} from "../../apiService";
import {VersionInfo} from "../../generated";
import {currentHintVersion} from "../../hintVersion";


export interface ErrorsActions {
    generateErrorReport: (store: ActionContext<ErrorsState, RootState>,
                          payload: ErrorReportManualDetails) => void;
}

export interface ErrorReportManualDetails {
    section: string,
    description: string,
    stepsToReproduce: string,
    email: string
}

export interface ErrorReport extends ErrorReportManualDetails {
    country: string,
    projectName: string | undefined,
    browserAgent: string,
    timeStamp: string,
    jobId: string,
    versions: VersionInfo,
    errors: Error[]
}

export const actions: ActionTree<ErrorsState, RootState> & ErrorsActions = {

    async generateErrorReport(context, payload) {
        const {dispatch, rootState, getters} = context
        const data = {
            email: payload.email || rootState.currentUser,
            country: rootState.baseline.country || "no associated country",
            projectName: rootState.projects.currentProject?.name || "no associated project",
            browserAgent: navigator.userAgent,
            timeStamp: new Date().toISOString(),
            jobId: rootState.modelRun.modelRunId || "no associated jobId",
            description: payload.description,
            section: payload.section,
            stepsToReproduce: payload.stepsToReproduce,
            versions: {hint: currentHintVersion, ...rootState.hintrVersion.hintrVersion as VersionInfo},
            errors: getters.errors
        }

        await api<ErrorsMutation, ErrorsMutation>(context)
            .withSuccess(ErrorsMutation.ErrorReportSuccess)
            .withError(ErrorsMutation.ErrorReportError)
            .postAndReturn("error-report", data)
            .then(() => {
                if (rootState.projects.currentProject && !rootState.errors.errorReportError) {
                    dispatch("projects/cloneProject",
                        {
                            emails: ["naomi-support@imperial.ac.uk"],
                            projectId: rootState.projects.currentProject!.id
                        })
                }
            })
    }
};
