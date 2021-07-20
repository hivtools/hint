<template></template>
<script lang="ts">
    import Vue from "vue";
    import { mapActionByName } from "../../utils";

    export default Vue.extend({
        methods: {
            getReleases: mapActionByName("adr", "getReleases"),
        },
        mounted(){
            this.getReleases
        }
    });
</script>