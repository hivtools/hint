import {Module} from "vuex";
import {RootState} from "../../root";
import {Error} from "../../generated";
import {ADRSchemas, Dict, UploadFile} from "../../types";
import {actions} from "./actions";
import {mutations} from "./mutations";

export interface ADRState {
    datasets: any[],
    fetchingDatasets: boolean,
    key: string | null,
    keyError: Error | null,
    adrError: Error | null,
    schemas: ADRSchemas | null,
    userCanUpload: boolean,
    uploadError: Error | null,
    uploading: boolean,
    uploadComplete: boolean,
    uploadFiles: Dict<UploadFile> | null
}

export const initialADRState = (): ADRState => {
    return {
        datasets: [],
        key: null,
        keyError: null,
        adrError: null,
        schemas: null,
        fetchingDatasets: false,
        userCanUpload: false,
        uploadError: null,
        uploading: false,
        uploadComplete: false,
        uploadFiles: null
    }
};

const namespaced = true;

export const adr: Module<ADRState, RootState> = {
    namespaced,
    state: {...initialADRState()},
    actions,
    mutations
};
