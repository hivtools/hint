import {Module} from 'vuex';
import {actions} from './actions';
import {mutations} from './mutations';
import {
    Error,
    Metadata,
    AdrMetadataResponse,
    FilterOption,
    ChoroplethIndicatorMetadata,
    ReviewInputFilterMetadataResponse,
    FilterTypes,
    PlotSettingsControl
} from "../../generated";
import {DataType} from "../surveyAndProgram/surveyAndProgram";
import { RootState } from '../../root';

export type PlotMetadataFrame = {
    filterTypes: FilterTypes[],
    indicators: ChoroplethIndicatorMetadata[],
    plotSettingsControl: {
        [k: string]: PlotSettingsControl
    }
}

export interface MetadataState {
    reviewInputMetadata: ReviewInputFilterMetadataResponse | null
    reviewInputMetadataError: Error | null
    reviewInputMetadataFetched: boolean
    adrUploadMetadata: AdrMetadataResponse[]
    adrUploadMetadataError: Error | null
}

export const initialMetadataState = (): MetadataState => {
    return {
        reviewInputMetadata: null,
        reviewInputMetadataError: null,
        reviewInputMetadataFetched: false,
        adrUploadMetadataError: null,
        adrUploadMetadata: [] as AdrMetadataResponse[]
    }
};

export const metadataGetters = {
    complete: (state: MetadataState) => {
        return !!state.reviewInputMetadata
    },
};

const namespaced = true;

export const metadata = (existingState: Partial<RootState> | null): Module<MetadataState, RootState> => {
    return {
        namespaced,
        state: {...initialMetadataState(), ...existingState && existingState.metadata},
        actions,
        mutations,
        getters: metadataGetters
    };
};
