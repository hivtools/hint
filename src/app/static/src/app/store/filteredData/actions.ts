import {ActionContext, ActionTree} from 'vuex';
import {FilteredDataState} from "./filteredData";
import {RootState} from "../../root";
import {FilterType} from "./filteredData";
import {}

export type FilteredDataActionTypes = "FilterAdded" | "FilterRemoved";

export interface FilteredDataActions {
    filterAdded: (store: ActionContext<FilteredDataState, RootState>, filterType: FilterType, filter: String) => void
    filterRemoved: (store: ActionContext<FilteredDataState, RootState>, filterType: FilterType, filter: String) => void
}

export const actions: ActionTree<FilteredDataState, RootState> & FilteredDataActions = {

    filterAdded({commit}, filterType, filter) {
        commit({type: "FilterAdded", payload: [filterType, filter]});
    },
    filterRemoved({commit}, filterType, filter) {
        commit({type: "FilterAdded", payload: [filterType, filter]});
    }
};