import {ActionContext, ActionTree} from 'vuex';
import {FilteredDataState} from "./filteredData";
import {RootState} from "../../root";
import {FilterType} from "./filteredData";
import {FilterOption} from "../../generated"

export interface FilteredDataActions {
    filterUpdated: (store: ActionContext<FilteredDataState, RootState>, payload: [FilterType, FilterOption[]]) => void
}

export const actions: ActionTree<FilteredDataState, RootState> & FilteredDataActions = {

    filterUpdated(store: ActionContext<FilteredDataState, RootState>, payload: [FilterType, FilterOption[]]) {
        store.commit({type: "FilterUpdated", payload: payload});
    },
};