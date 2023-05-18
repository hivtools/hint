<template>
    <div id="load-error-modal">
        <modal :open="hasError">
            <h4 v-translate="'loadError'"></h4>
            <p>{{ loadError }}</p>
            <template v-if="invalidSteps && invalidSteps.length">
              There are invalid steps in the loaded state. Repair state or retry load? If you repair some data may be lost.
              // TODO: translate all this!!
              <button type="button"
                      class="btn btn-red"
                      data-dismiss="modal"
                      aria-label="Retry"
                      @click="retryLoad">Retry
              </button>
              <button type="button"
                      class="btn btn-red"
                      data-dismiss="modal"
                      aria-label="Repair"
                      @click="repairInvalidState">Repair
              </button>
            </template>
            <template v-else>
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
    import Vue from "vue"
    import Modal from "../Modal.vue";

    interface Props {
        hasError: boolean
        loadError: string
        invalidSteps: number[]
        clearLoadError: () => void
        repairInvalidState: () => void
        retryLoad: () => void
    }

    export default Vue.extend<unknown, unknown, unknown, Props>({
        name: "LoadErrorModal",
        props: {
            hasError: Boolean,
            loadError: String,
            invalidSteps: Array,
            clearLoadError: Function,
            repairInvalidState: Function,
            retryLoad: Function
        },
        components: {
            Modal
        }
    })
</script>
