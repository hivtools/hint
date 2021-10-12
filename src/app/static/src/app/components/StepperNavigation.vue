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

    import Vue from "vue";

    export interface Props {
        back: () => void
        backDisabled: boolean
        next: () => void
        nextDisabled: boolean
    }

    export default Vue.extend<void, void, void, Props>({
        props: {
            back: Function,
            backDisabled: Boolean,
            next: Function,
            nextDisabled: Boolean
        }
    });

</script>
