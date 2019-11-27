<template>
    <modal :open="open">
        <h4>Have you saved your work?</h4>
        <p>Changing this will result in {{formattedSteps}} being reset.
            You may want to save your work before continuing.</p>
        <template v-slot:footer>
            <button type="button"
                    class="btn btn-white"
                    @click="continueEditing">
                I understand and I want to keep editing
            </button>
            <button type="button"
                    class="btn btn-red"
                    @click="cancelEditing">
                Cancel editing so I can save my work
            </button>
        </template>
    </modal>
</template>

<script lang="ts">
    import Vue from "vue";
    import Modal from "./Modal.vue";
    import {mapGetterByName} from "../utils";
    import {StepDescription} from "../store/stepper/stepper";

    export default Vue.extend<{}, {}, any, any>({
        props: ["open", "continueEditing", "cancelEditing"],
        computed: {
            laterCompleteSteps: mapGetterByName("stepper", "laterCompleteSteps"),
            formattedSteps() {
                const steps = this.laterCompleteSteps;
                if (steps.length == 0) {
                    // in practice this will never happen
                    return "no steps"
                }
                if (steps.length == 1) {
                    return "step " + formatStep(steps[0])
                } else {
                    return "steps " + steps.slice(0, steps.length - 1)
                        .map(formatStep)
                        .join(", ") + ", and " + formatStep(steps[steps.length - 1])
                }
            }
        },
        components: {Modal}
    });

    const formatStep = (step: StepDescription) => {
        return `${step.number} (${step.text})`
    };

</script>