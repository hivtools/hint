<template>
    <l-control position="topleft">
        <div class="checkbox-wrapper">
            <input id="base-map-checkbox" name="base-map-checkbox" type='checkbox' @change="toggleBaseMap" :checked="checked" />
            <label for="base-map-checkbox" v-translate="'showBaseMap'"></label>
        </div>
    </l-control>
</template>

<script setup lang="ts">
import { LControl } from "@vue-leaflet/vue-leaflet";

defineProps({
    checked: {
        type: Boolean,
        required: true
    },
})

const emit = defineEmits(['toggle-base-map'])

const toggleBaseMap = () => {
    emit('toggle-base-map')
}
</script>

<style scoped>
.checkbox-wrapper {
    display: flex;
    gap: 6px;
    align-items: center;
}
label {
    margin-bottom: 0px
}
</style>