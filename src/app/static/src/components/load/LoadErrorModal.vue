<template>
    <div id="load-error-modal">
        <modal :open="hasError">
            <h4 v-translate="'loadError'"></h4>
            <p>{{ loadError }}</p>
            <template v-slot:footer>
                <button type="button"
                        class="btn btn-red"
                        data-dismiss="modal"
                        aria-label="Close"
                        @click="clearLoadError"
                        v-translate="'ok'">
                </button>
            </template>
        </modal>
    </div>
</template>

<script lang="ts">
    import {defineComponent} from "vue"
    import Modal from "../Modal.vue";

    interface Props {
        hasError: boolean
        loadError: string
        clearLoadError: () => void
    }

    export default Vue.extend<unknown, unknown, unknown, Props>({
        name: "LoadErrorModal",
        props: {
            hasError: Boolean,
            loadError: String,
            clearLoadError: Function
        },
        components: {
            Modal
        }
    })
</script>
