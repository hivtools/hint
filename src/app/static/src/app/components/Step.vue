<template>
    <div class="col step" :class="[{'active': active}]">
        <button class="btn" :class="[{'btn-red': active || complete}]"
                :disabled="!enabled"
                v-on:click="$emit('jump', number)">{{number}}
        </button>
        <div class="text-center">{{text}}</div>
    </div>
</template>

<script lang="ts">

    import Vue from "vue";

    export default Vue.extend({
        props: ["active", "number", "text", "enabled", "complete"]
    })

</script>
