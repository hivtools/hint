import { defineComponent } from "vue";
import {mapStatePropByName} from "../../utils";

export default defineComponent({
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