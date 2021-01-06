import {ActionContext, ActionTree} from "vuex";
import {RootState} from "../../root";
import {StepDescription} from "../stepper/stepper";
import {RootMutation} from "./mutations";
import {LanguageActions} from "../language/language";
import {changeLanguage} from "../language/actions";
import i18next from "i18next";
import {api} from "../../apiService";
import qs from "qs";

export interface RootActions extends LanguageActions<RootState>{
    validate: (store: ActionContext<RootState, RootState>) => void;
    fetchADRKey: (store: ActionContext<RootState, RootState>) => void;
    saveADRKey: (store: ActionContext<RootState, RootState>, key: string) => void;
    deleteADRKey: (store: ActionContext<RootState, RootState>) => void;
    getADRDatasets: (store: ActionContext<RootState, RootState>) => void;
    getADRSchemas: (store: ActionContext<RootState, RootState>) => void;
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
        await changeLanguage<RootState>(context, payload)
    },

    async fetchADRKey(context) {
        await api<RootMutation, RootMutation>(context)
            .ignoreErrors()
            .withSuccess(RootMutation.UpdateADRKey)
            .get("/adr/key/");
    },

    async saveADRKey(context, key) {
        context.commit({type: RootMutation.SetADRKeyError, payload: null});
        await api<RootMutation, RootMutation>(context)
            .withError(RootMutation.SetADRKeyError)
            .withSuccess(RootMutation.UpdateADRKey)
            .postAndReturn("/adr/key/", qs.stringify({key}));
    },

    async deleteADRKey(context) {
        context.commit({type: RootMutation.SetADRKeyError, payload: null});
        await api<RootMutation, RootMutation>(context)
            .withError(RootMutation.SetADRKeyError)
            .withSuccess(RootMutation.UpdateADRKey)
            .delete("/adr/key/")
    },

    async getADRDatasets(context) {
        context.commit({type: RootMutation.SetADRFetchingDatasets, payload: true});
        await api<RootMutation, RootMutation>(context)
            .ignoreErrors()
            .withSuccess(RootMutation.SetADRDatasets)
            .get("/adr/datasets/")
            .then(() => {
                context.commit({type: RootMutation.SetADRFetchingDatasets, payload: false});
            });
    },

    async getADRSchemas(context) {
        await api<RootMutation, RootMutation>(context)
            .ignoreErrors()
            .withSuccess(RootMutation.SetADRSchemas)
            .get("/adr/schemas/")
    }

};
