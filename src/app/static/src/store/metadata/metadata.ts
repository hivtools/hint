import {Module} from 'vuex';
import {actions} from './actions';
import {mutations} from './mutations';
import {
    AdrMetadataResponse,
    IndicatorMetadata,
    Error,
    FilterTypes,
    PlotSettingsControl,
    ReviewInputFilterMetadataResponse
} from "../../generated";
import {RootState} from '../../root';
import {getters} from "./getters";

export type PlotMetadataFrame = {
    filterTypes: FilterTypes[],
    indicators: IndicatorMetadata[],
    plotSettingsControl: {
        [k: string]: PlotSettingsControl
    }
}

export interface MetadataState {
    reviewInputMetadata: ReviewInputFilterMetadataResponse | null
    reviewInputMetadataError: Error | null
    adrUploadMetadata: AdrMetadataResponse[]
    adrUploadMetadataError: Error | null
}

export const initialMetadataState = (): MetadataState => {
    return {
        reviewInputMetadata: null,
        reviewInputMetadataError: null,
        adrUploadMetadataError: null,
        adrUploadMetadata: [] as AdrMetadataResponse[]
    }
};

const namespaced = true;

export const metadata = (existingState: Partial<RootState> | null): Module<MetadataState, RootState> => {
    return {
        namespaced,
        state: {...initialMetadataState(), ...existingState && existingState.metadata},
        actions,
        mutations,
        getters
    };
};
