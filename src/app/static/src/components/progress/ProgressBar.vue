<template>
    <div class="my-2" :class="cssClass">
        <span class="title">{{ title }}</span>
        <tick color="#e31837" v-if="phase.complete" width="20px"></tick>
        <b-progress :max="1" v-if="!phase.complete" :animated="!isDeterminate">
            <b-progress-bar :value="value"></b-progress-bar>
        </b-progress>
    </div>
</template>

<script lang="ts">

    import Vue from "vue";
    import {BProgress, BProgressBar} from "bootstrap-vue";
    import Tick from "../Tick.vue";
    import {ProgressPhase} from "../../generated";

    interface Computed {
        isDeterminate: boolean
        value: number
        title: string
        cssClass: string
    }

    export default Vue.extend<unknown, unknown, Computed, { phase: ProgressPhase }>({
        props: {
            phase: Object
        },
        computed: {
            isDeterminate: function () {
                return this.phase.value !== undefined;
            },
            value: function () {
                if (this.isDeterminate) {
                    return this.phase.value!;
                }
                return 1;
            },
            title: function () {
                let title = this.phase.name;
                if (this.phase.started && this.phase.helpText) {
                    title += ": ";
                    title += this.phase.helpText
                }
                return title;
            },
            cssClass: function () {
                if (!this.phase.started) {
                    return "not-started";
                }
                if (this.phase.complete) {
                    return "finished";
                }
                return "in-progress";
            }
        },
        components: {
            BProgress,
            BProgressBar,
            Tick
        }
    });

</script>
