<template>
    <modal :open="open">
        <h4>Have you saved your work?</h4>
        <p>Changing this will result in the following steps being discarded:</p>
        <ul>
            <li v-for="step in formattedSteps">{{step}}</li>
        </ul>
        <p>You may want to save your work before continuing.</p>
        <template v-slot:footer>
            <button type="button"
                    class="btn btn-white"
                    @click="continueEditing">
                Discard these steps and keep editing
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

    interface Computed {
        laterCompleteSteps: StepDescription[]
        formattedSteps: string[]
    }

    interface Props {
        open: boolean
        continueEditing: boolean
        cancelEditing: boolean
    }

    export default Vue.extend<{}, {}, Computed, any>({
        props: ["open", "continueEditing", "cancelEditing"],
        computed: {
            laterCompleteSteps: mapGetterByName("stepper", "laterCompleteSteps"),
            formattedSteps() {
                return this.laterCompleteSteps.map(formatStep)
            }
        },
        components: {Modal}
    });

    const formatStep = (step: StepDescription) => {
        return `Step ${step.number}: ${step.text}`
    };

</script>
