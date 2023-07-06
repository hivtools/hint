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
    import { PropType } from "vue";
import {defineComponentVue2WithProps} from "../../defineComponentVue2/defineComponentVue2"
    import Modal from "../Modal.vue";

    interface Props {
        hasError: boolean
        loadError?: string
        clearLoadError: () => void
    }

    export default defineComponentVue2WithProps<unknown, unknown, unknown, Props>({
        name: "LoadErrorModal",
        props: {
            hasError: {
                type: Boolean,
                required: true
            },
            loadError: {
                type: String,
                required: false
            },
            clearLoadError: {
                type: Function as PropType<Props["clearLoadError"]>,
                required: true
            }
        },
        components: {
            Modal
        }
    })
</script>
