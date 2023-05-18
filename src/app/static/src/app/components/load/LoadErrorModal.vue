<template>
    <div id="load-error-modal">
        <modal :open="hasError">
            <h4 v-translate="'loadError'"></h4>
            <p v-if="showInvalidSteps">
              There are invalid steps in the loaded state. Repair state or retry load? If you repair some data may be lost.
            </p>
            <p v-else>{{ loadError }}</p>
            <template v-slot:footer>
              <template v-if="showInvalidSteps">
                <button id="retry-load"
                        type="button"
                        class="btn btn-red"
                        data-dismiss="modal"
                        aria-label="Retry"
                        @click="retryLoad"
                        v-translate="'retry'">
                </button>
                <button id="rollback-load"
                        type="button"
                        class="btn btn-red"
                        data-dismiss="modal"
                        aria-label="Rollback"
                        @click="rollbackInvalidState"
                        v-translate="'rollback'">
                </button>
              </template>
              <template v-else>
                  <button id="ok-load-error"
                          type="button"
                          class="btn btn-red"
                          data-dismiss="modal"
                          aria-label="Close"
                          @click="clearLoadError"
                          v-translate="'ok'">
                  </button>
              </template>
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
        rollbackInvalidState: () => void
        retryLoad: () => void
    }

    export default Vue.extend<unknown, unknown, unknown, Props>({
        name: "LoadErrorModal",
        props: {
            hasError: Boolean,
            loadError: String,
            invalidSteps: Array,
            clearLoadError: Function,
            rollbackInvalidState: Function,
            retryLoad: Function
        },
        computed: {
          showInvalidSteps: function() { return this.invalidSteps?.length > 0; }
        },
        components: {
            Modal
        }
    })
</script>
