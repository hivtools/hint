<template>
    <div class="row mt-2">
        <div class="col">
            <a href="#" id="back"
               v-on:click="back"
               class="text-uppercase font-weight-bold pr-1"
               :class="{'disabled': backDisabled}"
               v-translate="'back'"></a>/
            <a href="#" id="continue"
               v-on:click="next"
               class="text-uppercase font-weight-bold"
               :class="{'disabled': nextDisabled}"
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
