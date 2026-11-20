<template>
    <div class="text-center" id="step-loading">
        <loading-spinner size="lg"></loading-spinner>
        <h2 v-translate="'loadingData'"></h2>
    </div>
</template>

<script lang="ts">
import {defineComponent} from "vue";
import LoadingSpinner from "./LoadingSpinner.vue";

export default defineComponent({
    components: {LoadingSpinner}
});
</script>
