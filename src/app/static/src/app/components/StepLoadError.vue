<template>
    <div class="alert alert-danger" id="step-load-error" role="alert">
        <p v-translate="'stepLoadError'"></p>
        <button type="button" class="btn btn-red" v-translate="'reloadPage'" @click="reload"></button>
    </div>
</template>

<script lang="ts">
import {defineComponent} from "vue";

export default defineComponent({
    methods: {
        // The page was loaded before a deploy and its files are gone, or the connection failed.
        // The new files may not work with the old page, so the only safe fix is a full reload.
        // The store is kept in local storage, so the user stays on the same step.
        reload() {
            window.location.reload();
        }
    }
});
</script>
