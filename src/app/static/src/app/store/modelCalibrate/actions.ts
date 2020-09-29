import {ModelCalibrateState} from "./modelCalibrate";
import {ActionContext, ActionTree} from "vuex";
import {DynamicFormMeta} from "@reside-ic/vue-dynamic-form";
import {api} from "../../apiService";
import {RootState} from "../../root";
import {ModelCalibrateMutation} from "./mutations";

export interface ModelCalibrateActions {
    fetchModelCalibrateOptions: (store: ActionContext<ModelCalibrateState, RootState>) => void
    calibrate: (store: ActionContext<ModelCalibrateState, RootState>) => void
}

export const actions: ActionTree<ModelCalibrateState, RootState> & ModelCalibrateActions = {

    async fetchModelCalibrateOptions(context) {
        const {commit} = context;
        commit(ModelCalibrateMutation.FetchingModelCalibrateOptions);
        //TODO: fetch from backend
        const placeholderFormMeta = {
           controlSections: [{
               label: "Test Section",
               description: "Just a test section",
               controlGroups: [{
                   controls: [{
                       name: "TestValue",
                       type: "number",
                       required: false,
                       min: 0,
                       max: 10,
                       value: 5
                   }]
               }]
           }]
       };
       commit(ModelCalibrateMutation.ModelCalibrateOptionsFetched, {payload: placeholderFormMeta});
    },

    async calibrate(context) {
        const {commit} = context;
        //TODO: send calibration form values to backend, and get results
        commit(ModelCalibrateMutation.Calibrated);
    }
};
