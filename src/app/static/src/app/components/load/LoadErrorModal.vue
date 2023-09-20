<template>
    <div id="load-error-modal">
        <modal :open="hasError">
            <h4 v-translate="'loadError'"></h4>
            <p id="load-error-error">{{ loadError }}</p>
            <template v-slot:footer>
                <button id="ok-load-error"
                        type="button"
                        class="btn btn-red"
                        data-dismiss="modal"
                        v-translate:aria-label="'ok'"
                        @click="clearLoadError"
                        v-translate="'ok'">
                </button>
            </template>
        </modal>
    </div>
</template>

<script lang="ts">
    import { defineComponent } from "vue";
    import Modal from "../Modal.vue";
    import {mapActionByName, mapStateProps} from "../../utils";
    import {LoadingState, LoadState} from "../../store/load/state";

    export default defineComponent({
        name: "LoadErrorModal",
        computed: {
            ...mapStateProps("load", {
              hasError: (state: LoadState) => state.loadingState === LoadingState.LoadFailed,
              loadError: (state: LoadState) => state.loadError && state.loadError.detail
            })
        },
        methods: {
            clearLoadError: mapActionByName("load", "clearLoadState")
        },
        components: {
            Modal
        }
    })
</script>
