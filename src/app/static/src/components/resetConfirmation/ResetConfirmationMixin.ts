import {defineComponent} from "vue";
import {mapStatePropByName} from "../../utils";

interface Computed {
    editsRequireConfirmation: boolean,
    dataExplorationMode: boolean
}

export default defineComponent<unknown, unknown, Computed, unknown>({
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