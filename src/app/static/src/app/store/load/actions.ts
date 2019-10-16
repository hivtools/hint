import {ActionContext, ActionTree} from "vuex";
import {LoadState} from "../load/load";
import {RootState} from "../../root";

export interface LoadActions {
    load: (store: ActionContext<LoadState, RootState>, file: File) => void
}

export const actions: ActionTree<LoadState, RootState> & LoadActions = {
    async load({commit, dispatch, state}, file) {
        const reader = new FileReader();
        reader.addEventListener('loadend', function() {
            const fileContents = JSON.parse(reader.result as string);
            const files = fileContents.files;
            //alert("loading files: " + JSON.stringify(files));
        });
        reader.readAsText(file);
    }
};