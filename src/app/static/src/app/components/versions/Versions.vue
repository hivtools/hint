<template>
    <button type="button"
            class="btn btn-red"
            @click="createVersion"
            v-translate="'createVersion'">
    </button>
</template>

<script lang="ts">
    import Vue from "vue";
    import {mapActionByName} from "../../utils";

    const namespace = "versions";

    export default Vue.extend({
        methods: {
            createVersion: mapActionByName(namespace, "createVersion")
        }
    });
</script>
