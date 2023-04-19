import { defineComponentVue2 } from "../../defineComponentVue2/defineComponentVue2";
import {mapStatePropByName} from "../../utils";

interface Computed {
    editsRequireConfirmation: boolean,
    dataExplorationMode: boolean
}

export default defineComponentVue2<unknown, unknown, Computed>({
    computed: {
        dataExplorationMode: mapStatePropByName(null, "dataExplorationMode"),
        editsRequireConfirmation() {
            if (this.dataExplorationMode) {
                return false
            }
            return this.$store.getters["stepper/editsRequireConfirmation"]
        }
    }
});