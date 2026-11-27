import type {Module} from "vuex";
import type {Error as ErrorType} from "../../generated";
import type {ADRSchemas} from "../../types";
import {actions} from "./actions";
import {mutations} from "./mutations";
import type {RootState} from "../../root";

export enum AdrDatasetType {
    Input = "input",
    Output = "output"
}

export const getAdrDatasetUrl = (datasetType: AdrDatasetType): string => {
    switch (datasetType) {
        case AdrDatasetType.Input:
            return `/adr/datasets?type=${AdrDatasetType.Input}`;
        case AdrDatasetType.Output:
            return `/adr/datasets?type=${AdrDatasetType.Output}`;
        default:
            throw new Error(`Unexpected value for AdrDatasetType: ${datasetType}`);
    }
};

export const getAdrReleaseUrl = (datasetType: AdrDatasetType, datasetId: string): string => {
    switch (datasetType) {
        case AdrDatasetType.Input:
            return `/adr/datasets/${datasetId}/releases`;
        case AdrDatasetType.Output:
            return `/adr/datasets/${datasetId}/releases?type=${AdrDatasetType.Output}`;
        default:
            throw new Error(`Unexpected value for AdrDatasetType: ${datasetType}`);
    }
};

export interface ADRDatasetState {
    datasets: any[],
    releases: any[],
    fetchingDatasets: boolean,
    fetchingError: ErrorType | null,
}

export interface ADRState {
    adrData: {
        [key in AdrDatasetType]: ADRDatasetState
    },
    schemas: ADRSchemas | null,
    userCanUpload: boolean
}

export const initialADRState = (): ADRState => {
    return {
        adrData: {
            input: {
                datasets: [],
                releases: [],
                fetchingDatasets: false,
                fetchingError: null
            },
            output: {
                datasets: [],
                releases: [],
                fetchingDatasets: false,
                fetchingError: null
            }
        },
        schemas: null,
        userCanUpload: false
    }
};

const namespaced = true;

export const adr: Module<ADRState, RootState> = {
    namespaced,
    state: {...initialADRState()},
    actions,
    mutations
};
