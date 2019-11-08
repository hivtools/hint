import {Mutation, MutationTree} from 'vuex';
import {ModelOptionsState} from "./modelOptions";
import {DynamicFormData, DynamicFormMeta} from "../../components/forms/types";
import {PayloadWithType} from "../../types";

type ModelOptionsMutation = Mutation<ModelOptionsState>

export interface MetadataMutations {
    validate: ModelOptionsMutation,
    update: ModelOptionsMutation,
    FormMetaUpdated: ModelOptionsMutation
}

export const mutations: MutationTree<ModelOptionsState> & MetadataMutations = {
    validate(state: ModelOptionsState, payload: DynamicFormData) {
        state.options = payload;
        // TODO validate from server
        state.valid = true;
    },

    update(state: ModelOptionsState, payload: DynamicFormMeta) {
        state.optionsFormMeta = payload;
    },

    FormMetaUpdated(state: ModelOptionsState, action: PayloadWithType<DynamicFormMeta>) {
        const controlSections = action.payload.controlSections;
        const allControlSectionLabels = controlSections.map(c => c.label);
        const existingControlSectionLabels = state.optionsFormMeta.controlSections.map(c => c.label);
        const newSectionLabels = allControlSectionLabels.filter(l => existingControlSectionLabels.indexOf(l) == -1);
        const newSections = controlSections.filter(c => newSectionLabels.indexOf(c.label) > -1);
        state.optionsFormMeta.controlSections = state.optionsFormMeta.controlSections.concat(newSections)
            .filter(c => allControlSectionLabels.indexOf(c.label) > -1)
    }

};
