<template>
    <div class="col step" :class="[{'active': active, 'complete': complete, 'enabled': enabled}]">
        <button class="btn" :class="[{'btn-red': complete, 'btn-white': enabled && !complete}]"
                :disabled="!enabled"
                v-on:click="$emit('jump', number)">{{ number }}
        </button>
        <div class="text-center mt-3" v-translate="textKey"></div>
    </div>
</template>

<script lang="ts">

    import Vue from "vue";

    export default Vue.extend({
        props: ["active", "number", "textKey", "enabled", "complete"]
    })

</script>
