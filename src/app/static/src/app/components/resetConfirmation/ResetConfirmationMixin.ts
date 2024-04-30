import { defineComponent } from "vue";

export default defineComponent({
    computed: {
        editsRequireConfirmation() {
            return this.$store.getters["stepper/editsRequireConfirmation"]
        }
    }
});
