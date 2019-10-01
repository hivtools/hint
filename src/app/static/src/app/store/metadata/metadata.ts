import {Module} from 'vuex';
import {actions} from './actions';
import {mutations} from './mutations';
import {RootState} from "../../root";
import {PlottingMetadataResponse} from "../../generated";

export interface MetadataState {
    plottingMetadataError: string
    plottingMetadata: PlottingMetadataResponse | null
}

export const initialMetadataState: MetadataState = {
    plottingMetadataError: "",
    plottingMetadata: null
};

export const metadataGetters = {
    complete: (state: MetadataState) => {
        return !!state.plottingMetadata
    }
};

const namespaced: boolean = true;

export const metadata: Module<MetadataState, RootState> = {
    namespaced,
    state: initialMetadataState,
    actions,
    mutations,
    getters: metadataGetters
};
