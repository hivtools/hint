import {ActionContext, ActionTree} from 'vuex';
import {FilteredDataState} from "./filteredData";
import {RootState} from "../../root";
import {FilterType} from "./filteredData";

export interface FilteredDataActions {
    filterAdded: (store: ActionContext<FilteredDataState, RootState>, payload: [FilterType, String]) => void
    filterRemoved: (store: ActionContext<FilteredDataState, RootState>, payload: [FilterType, String]) => void
}

export const actions: ActionTree<FilteredDataState, RootState> & FilteredDataActions = {

    filterAdded(store: ActionContext<FilteredDataState, RootState>, payload: [FilterType, String]) {
        store.commit({type: "FilterAdded", payload: payload});
    },
    filterRemoved(store: ActionContext<FilteredDataState, RootState>, payload: [FilterType, String]) {
        store.commit({type: "FilterRemoved", payload: payload});
    }
};