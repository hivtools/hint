<template>
    <span class="d-flex justify-content-between">
        <slot></slot>
        <vue-feather v-show="showReset"
                     :type="iconType"
                     class="filter-reset-icon"
                     size="20"
                     @click="$emit('reset')"></vue-feather>
    </span>
</template>

<script setup lang="ts">
import VueFeather from "vue-feather";

defineProps({
    showReset: { type: Boolean, required: false, default: true },
    iconType: { type: String, required: true }
});
</script>