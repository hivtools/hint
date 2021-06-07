import {MutationTree} from 'vuex';
import {ModelCalibrateState} from "./modelCalibrate";
import {DynamicFormData, DynamicFormMeta} from "@reside-ic/vue-dynamic-form";
import {PayloadWithType} from "../../types";
import {updateForm} from "../../utils";
import {
    CalibrateStatusResponse,
    CalibrateSubmitResponse,
    Error,
    VersionInfo
} from "../../generated";

export enum ModelCalibrateMutation {
    FetchingModelCalibrateOptions = "FetchingModelCalibrateOptions",
    ModelCalibrateOptionsFetched = "ModelCalibrateOptionsFetched",
    SetModelCalibrateOptionsVersion = "SetModelCalibrateOptionsVersion",
    Update = "Update",
    CalibrateStarted = "CalibrateStarted",
    CalibrateStatusUpdated = "CalibrateStatusUpdated",
    Calibrated = "Calibrated",
    SetOptionsData = "SetOptionsData",
    SetError = "SetError",
    PollingForStatusStarted = "PollingForStatusStarted",
    Ready = "Ready",
    CalibrationPlotStarted = "CalibrationPlotStarted",
    CalibrationPlotGenerated = "CalibrationPlotGenerated",
    SetPlotData = "SetPlotData"
}

export const mutations: MutationTree<ModelCalibrateState> = {
    [ModelCalibrateMutation.Ready](state: ModelCalibrateState) {
        state.ready = true;
    },

    [ModelCalibrateMutation.FetchingModelCalibrateOptions](state: ModelCalibrateState) {
        state.fetching = true;
    },

    [ModelCalibrateMutation.ModelCalibrateOptionsFetched](state: ModelCalibrateState, action: PayloadWithType<DynamicFormMeta>) {
        const newForm = {...updateForm(state.optionsFormMeta, action.payload)};
        state.optionsFormMeta = newForm;
        state.fetching = false;
    },

    [ModelCalibrateMutation.Update](state: ModelCalibrateState, payload: DynamicFormMeta) {
        state.complete = false;
        state.optionsFormMeta = payload;
    },

    [ModelCalibrateMutation.CalibrateStarted](state: ModelCalibrateState, action: PayloadWithType<CalibrateSubmitResponse>) {
        state.calibrateId = action.payload.id;
        state.calibrating = true;
        state.complete = false;
        state.error = null;
        state.status = {} as CalibrateStatusResponse;
    },

    [ModelCalibrateMutation.CalibrateStatusUpdated](state: ModelCalibrateState, action: PayloadWithType<CalibrateStatusResponse>) {
        if (action.payload.done) {
            stopPolling(state);
        }
        state.status = action.payload;
        state.error = null;
    },

    [ModelCalibrateMutation.Calibrated](state: ModelCalibrateState) {
        state.complete = true;
        state.calibrating = false
    },

    [ModelCalibrateMutation.CalibrationPlotStarted](state: ModelCalibrateState) {
        // state.calibrateId = action.payload.id;
        state.generatingCalibrationPlot = true;
        state.calibrationPlotGenerated = false;
        state.error = null;
        // state.status = {} as CalibrateStatusResponse;
    },

    [ModelCalibrateMutation.CalibrationPlotGenerated](state: ModelCalibrateState) {
        state.calibrationPlotGenerated = true;
        state.generatingCalibrationPlot = false
    },

    [ModelCalibrateMutation.SetPlotData](state: ModelCalibrateState, action: PayloadWithType<any>) {
        console.log('payload', action)
        state.calibratePlotResult = action;
    },

    [ModelCalibrateMutation.SetModelCalibrateOptionsVersion](state: ModelCalibrateState, action: PayloadWithType<VersionInfo>) {
        state.version = action.payload;
    },

    [ModelCalibrateMutation.SetOptionsData](state: ModelCalibrateState, action: PayloadWithType<DynamicFormData>) {
        state.options = action.payload;
    },

    [ModelCalibrateMutation.SetError](state: ModelCalibrateState, action: PayloadWithType<Error>) {
        state.error = action.payload;
        state.calibrating = false;
        state.generatingCalibrationPlot = false;
        if (state.statusPollId > -1) {
            stopPolling(state);
        }
    },

    [ModelCalibrateMutation.PollingForStatusStarted](state: ModelCalibrateState, action: PayloadWithType<number>) {
        state.statusPollId = action.payload;
    }
};

const stopPolling = (state: ModelCalibrateState) => {
    clearInterval(state.statusPollId);
    state.statusPollId = -1;
};
