import {Module} from "vuex";
import {Error as ErrorType} from "../../generated";
import {ADRSchemas} from "../../types";
import {actions} from "./actions";
import {mutations} from "./mutations";
import {RootState} from "../../root";

export enum AdrDatasetType {
    Input = "input",
    Output = "output"
}

export const outputZipResourceId = "outputZip"

export const getAdrDatasetUrl = (datasetType: AdrDatasetType): string => {
    switch (datasetType) {
        case AdrDatasetType.Input:
            return "/adr/datasets/";
        case AdrDatasetType.Output:
            return `/adr/datasetsWithResource?resourceType=${outputZipResourceId}`;
        default:
            throw new Error(`Unexpected value for AdrDatasetType: ${datasetType}`);
    }
};

export const getAdrReleaseUrl = (datasetType: AdrDatasetType, datasetId: string): string => {
    switch (datasetType) {
        case AdrDatasetType.Input:
            return `/adr/datasets/${datasetId}/releases/`;
        case AdrDatasetType.Output:
            return `/adr/datasets/${datasetId}/releasesWithResource?resourceType=${outputZipResourceId}`;
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
    key: string | null,
    keyError: ErrorType | null,
    schemas: ADRSchemas | null,
    userCanUpload: boolean,
    ssoLogin: boolean
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
        key: null,
        keyError: null,
        schemas: null,
        userCanUpload: false,
        ssoLogin: false
    }
};

const namespaced = true;

export const adr: Module<ADRState, RootState> = {
    namespaced,
    state: {...initialADRState()},
    actions,
    mutations
};
