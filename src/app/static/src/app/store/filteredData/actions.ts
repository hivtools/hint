import {ActionContext, ActionTree} from 'vuex';
import {DataType, FilteredDataState} from "./filteredData";
import {RootState} from "../../root";
import {FilterType} from "./filteredData";
import {FilterOption} from "../../generated"

export interface FilteredDataActions {
    filterUpdated: (store: ActionContext<FilteredDataState, RootState>, payload: [FilterType, FilterOption[]]) => void,
    selectDataType: (store: ActionContext<FilteredDataState, RootState>, payload: DataType) => void
}

export const actions: ActionTree<FilteredDataState, RootState> & FilteredDataActions = {

    filterUpdated(store: ActionContext<FilteredDataState, RootState>, payload: [FilterType, FilterOption[]]) {
        store.commit({type: "FilterUpdated", payload: payload});
    },

    selectDataType(store, payload) {
        store.commit({type: "SelectedDataTypeUpdated", payload: payload})
    }
};