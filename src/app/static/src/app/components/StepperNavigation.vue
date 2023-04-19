<template>
    <div class="row mt-2">
        <div class="col">
            <a id="back" href="#"
               class="text-uppercase font-weight-bold pr-1"
               :class="{'disabled': backDisabled}"
               v-on="backDisabled ? {} : { click: back }"
               v-translate="'back'"></a>
            /
            <a id="continue" href="#"
               class="text-uppercase font-weight-bold"
               :class="{'disabled': nextDisabled}"
               v-on="nextDisabled ? {} : { click: next }"
               v-translate="'continue'"></a>
        </div>
    </div>
</template>

<script lang="ts">

    import {PropType} from "vue";
    import { defineComponentVue2WithProps } from "../defineComponentVue2/defineComponentVue2";
    import {StepperNavigationProps} from "../types";

    export default defineComponentVue2WithProps<unknown, unknown, unknown, StepperNavigationProps>({
        props: {
            back: {
                type: Function as PropType<() => void>,
                required: true
            },
            backDisabled: {
                type: Boolean,
                required: true
            },
            next: {
                type: Function as PropType<() => void>,
                required: true
            },
            nextDisabled: {
                type: Boolean,
                required: true
            }
        }
    });

</script>
