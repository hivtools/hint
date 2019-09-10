import {ActionContext, ActionTree} from 'vuex';
import {FilteredDataState} from "./filteredData";
import {RootState} from "../../root";
import {FilterType} from "./filteredData";

export interface FilteredDataActions {
    filterUpdated: (store: ActionContext<FilteredDataState, RootState>, payload: [FilterType, string[]]) => void
}

export const actions: ActionTree<FilteredDataState, RootState> & FilteredDataActions = {

    filterUpdated(store: ActionContext<FilteredDataState, RootState>, payload: [FilterType, string[]]) {
        store.commit({type: "FilterUpdated", payload: payload});
    },
};