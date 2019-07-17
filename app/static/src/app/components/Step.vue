<template>
    <div class="col" :class="[{'active': active}]">
        <button :class="['btn', {'btn-default': !active}, {'btn-red': active}]"
                v-on:click="$emit('step', type)">Step</button>
    </div>
</template>

<script lang="ts">

    import Vue from "vue";
    export default Vue.extend({
        props: ["active", "type"]
    })

</script>
