<template>
    <div class="pt-1 text-danger">
        <div class="error-message">{{ message }}</div>
        <div v-if="hasTrace">
            <a href="#" @click="toggleTrace" :class="cssClass"><strong>stack trace</strong></a>
            <div v-if="showTrace" class="ml-3">
                <div v-for="(traceMessage, index) in error.trace" :key="index" class="error-trace">
                    {{ traceMessage }}
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {Error} from "../generated";

    interface Data {
        showTrace: boolean
    }

    interface Props {
        error: Error
    }

    interface Computed {
        message: string,
        hasTrace: boolean,
        cssClass: string
    }

    interface Methods {
        toggleTrace: () => void
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
        props: {
            "error": Object
        },
        data(): Data {
            return {
                showTrace: false
            }
        },
        computed: {
            message: function () {
                return this.error.detail ? this.error.detail : this.error.error
            },
            hasTrace: function () {
                return !!this.error.trace && this.error.trace.length > 0
            },
            cssClass: function () {
                return this.showTrace ? "up" : "down";
            }
        },
        methods: {
            toggleTrace: function () {
                this.showTrace = !this.showTrace;
            }
        }
    });
</script>

<modal id="load-project-name" :open="requestProjectName">
<h4 v-translate="'loadFileToProjectHeader'"></h4>
<label class="h5" for="project-name-input" v-translate="'enterProjectName'"></label>
<input id="project-name-input" type="text" class="form-control"
       v-translate:placeholder="'projectName'" v-model="newProjectName">
<template v-slot:footer>
    <button id="confirm-load-project"
            type="button"
            class="btn btn-red"
            @click="loadToNewProject"
            v-translate="'createProject'"
            :disabled="!newProjectName">
    </button>
    <button id="cancel-load-project"
            type="button"
            class="btn btn-white"
            @click="cancelLoad"
            v-translate="'cancel'">
    </button>
</template>
</modal>

<modal :open="hasError">
<h4 v-translate="'loadError'"></h4>
<p>{{ loadError }}</p>
<template v-slot:footer>
    <button type="button"
            class="btn btn-red"
            data-dismiss="modal"
            aria-label="Close"
            @click="clearLoadError" v-translate="'ok'">
    </button>
</template>
</modal>