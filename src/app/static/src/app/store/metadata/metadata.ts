import {Module} from 'vuex';
import {actions} from './actions';
import {mutations} from './mutations';
import {RootState} from "../../root";
import {
    ChoroplethIndicatorMetadata,
    PlottingMetadataResponse,
    Error,
    Metadata,
    AdrMetadataResponse
} from "../../generated";
import {localStorageManager} from "../../localStorageManager";
import {DataType} from "../surveyAndProgram/surveyAndProgram";
import {DataExplorationState} from "../dataExploration/dataExploration";

export interface MetadataState {
    plottingMetadataError: Error | null
    plottingMetadata: PlottingMetadataResponse | null
    adrUploadMetadata: AdrMetadataResponse[]
    adrUploadMetadataError: Error | null
}

export const initialMetadataState = (): MetadataState => {
    return {
        plottingMetadataError: null,
        plottingMetadata: null,
        adrUploadMetadataError: null,
        adrUploadMetadata: [] as AdrMetadataResponse[]
    }
};

export const metadataGetters = {
    complete: (state: MetadataState) => {
        return !!state.plottingMetadata
    },
    sapIndicatorsMetadata: (state: MetadataState, getters: any, rootState: DataExplorationState, rootGetters: any) => {
        const plottingMetadata = state.plottingMetadata;

        if (!plottingMetadata) {
            return [];
        }

        const selectedDataType = rootState.surveyAndProgram.selectedDataType;

        let metadataForType: Metadata | null = null;
        switch (selectedDataType) {
            case (DataType.ANC):
                metadataForType = plottingMetadata.anc;
                break;
            case (DataType.Program):
                metadataForType = plottingMetadata.programme;
                break;
            case (DataType.Survey):
                metadataForType = plottingMetadata.survey;
                break;
        }

        return (metadataForType && metadataForType.choropleth) ? metadataForType.choropleth.indicators : [];
    },
    outputIndicatorsMetadata: (state: MetadataState, getters: any, rootState: DataExplorationState, rootGetters: any) => {
        return (state.plottingMetadata && state.plottingMetadata.output.choropleth &&
            state.plottingMetadata.output.choropleth.indicators) || [];
    }
};

const namespaced = true;
const existingState = localStorageManager.getState();

export const metadata: Module<MetadataState, DataExplorationState> = {
    namespaced,
    state: {...initialMetadataState(), ...existingState && existingState.metadata},
    actions,
    mutations,
    getters: metadataGetters
};
