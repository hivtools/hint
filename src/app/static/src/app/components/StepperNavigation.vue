<template>
    <div class="row mt-2">
        <div class="col">
            <a id="back" href="#"
               class="text-uppercase font-weight-bold pr-1"
               :class="{'disabled': backDisabled}"
               v-on="backDisabled ? {} : { click: back }"
               v-translate="'back'"
               :aria-disabled="backDisabled"></a>
            /
            <a id="continue" href="#"
               class="text-uppercase font-weight-bold"
               :class="{'disabled': nextDisabled}"
               v-on="nextDisabled ? {} : { click: next }"
               v-translate="'continue'"
               :aria-disabled="nextDisabled"></a>
        </div>
    </div>
</template>

<script lang="ts">

    import {PropType, defineComponent} from "vue";

    export default defineComponent({
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
