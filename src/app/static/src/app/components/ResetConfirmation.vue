<template>
    <modal :open="open">
        <h4 v-translate="'haveYouSaved'"></h4>
        <p v-translate="'discardWarning'"></p>
        <ul>
            <li v-for="step in laterCompleteSteps">
                Step {{step.number}}: <span v-translate="step.textKey"></span>
            </li>
        </ul>
        <p v-translate="'savePrompt'"></p>
        <template v-slot:footer>
            <button type="button"
                    class="btn btn-white"
                    @click="continueEditing"
                    v-translate="'discardSteps'">
            </button>
            <button type="button"
                    class="btn btn-red"
                    @click="cancelEditing"
                    v-translate="'cancelEdit'">
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
    }

    interface Props {
        open: boolean
        continueEditing: boolean
        cancelEditing: boolean
    }

    export default Vue.extend<{}, {}, Computed, any>({
        props: ["open", "continueEditing", "cancelEditing"],
        computed: {
            laterCompleteSteps: mapGetterByName("stepper", "laterCompleteSteps")
        },
        components: {Modal}
    });

</script>
