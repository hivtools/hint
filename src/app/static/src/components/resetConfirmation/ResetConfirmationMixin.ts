import {defineComponent} from "vue";
import {mapStatePropByName} from "../../utils";

interface Computed {
    editsRequireConfirmation: boolean,
    dataExplorationMode: boolean
}

export default Vue.extend<unknown, unknown, Computed, unknown>({
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