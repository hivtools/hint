import { mapGetterByName } from "@/utils";
import { defineComponent } from "vue";

export default defineComponent({
    computed: {
        editsRequireConfirmation: mapGetterByName<boolean>("stepper", "editsRequireConfirmation")
    }
});
