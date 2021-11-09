import {ActionContext, ActionTree} from "vuex";
import {RootState} from "../../root";
import {StepDescription} from "../stepper/stepper";
import {RootMutation} from "./mutations";
import {LanguageActions} from "../language/language";
import {changeLanguage} from "../language/actions";
import i18next from "i18next";
import {api} from "../../apiService";
import {VersionInfo} from "../../generated";
import {currentHintVersion} from "../../hintVersion";
import {ErrorReportManualDetails} from "../../types";
import {LanguageMutation} from "../language/mutations";


export interface RootActions extends LanguageActions<RootState> {
    validate: (store: ActionContext<RootState, RootState>) => void;
    generateErrorReport: (store: ActionContext<RootState, RootState>,
                          payload: ErrorReportManualDetails) => void;
}

export const actions: ActionTree<RootState, RootState> & RootActions = {
    async validate(store) {
        const {state, getters, commit, dispatch} = store;
        const completeSteps = state.stepper.steps.map((s: StepDescription) => s.number)
            .filter((i: number) => getters["stepper/complete"][i]);
        const maxCompleteOrActive = Math.max(...completeSteps, state.stepper.activeStep);

        const invalidSteps = state.stepper.steps.map((s: StepDescription) => s.number)
            .filter((i: number) => i < maxCompleteOrActive && !completeSteps.includes(i));

        if (invalidSteps.length > 0) {

            //Invalidate any steps which come after the first invalid step
            const maxValidStep = Math.min(...invalidSteps) - 1;

            const promises: Promise<any>[] = [];

            if (maxValidStep < 1) {
                promises.push(dispatch("baseline/deleteAll"));
            }
            if (maxValidStep < 2) {
                promises.push(dispatch("surveyAndProgram/deleteAll"));
            }

            if (promises.length > 0) {
                await Promise.all(promises);
            }

            commit({type: RootMutation.Reset, payload: maxValidStep});
            commit({type: RootMutation.ResetSelectedDataType});

            commit({
                type: "load/LoadFailed",
                payload: {
                    detail: i18next.t("loadFailedErrorDetail")
                }
            });
        }
    },

    async changeLanguage(context, payload) {
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

        await Promise.all(actions);
        commit({type: LanguageMutation.SetUpdatingLanguage, payload: false});
    },

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

        await api<RootMutation, RootMutation>(context)
            .withSuccess(RootMutation.ErrorReportSuccess)
            .withError(RootMutation.ErrorReportError)
            .postAndReturn("error-report", data)
            .then(() => {
                if (rootState.projects.currentProject && !rootState.errorReportError) {
                    dispatch("projects/cloneProject",
                        {
                            emails: ["naomi-support@imperial.ac.uk"],
                            projectId: rootState.projects.currentProject!.id
                        })
                }
            })
    }
};
