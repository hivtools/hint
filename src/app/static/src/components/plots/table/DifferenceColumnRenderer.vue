<template>
    <span class="d-inline-flex">
        <span v-if="cellData.icon"
              class="cell-icon me-1"
              :style="{ color: cellData.iconColor }">
            {{ cellData.icon }}
        </span>
        {{ cellData.cellText }}
    </span>

</template>

<script setup lang="ts">
import {ICellRendererParams} from "ag-grid-community";
import {computed, PropType} from "vue";
import {DIFFERENCE_POSITIVE_COLOR, DIFFERENCE_NEGATIVE_COLOR} from "./utils";

const props = defineProps({
    params: {
        type: Object as PropType<ICellRendererParams>,
        required: true
    }
});

const cellData = computed(() => {
    const value = props.params.value;
    return {
        cellText: props.params.valueFormatted,
        icon: value > 0 ? "▲" : value < 0 ? "▼" : "",
        iconColor: value > 0 ? DIFFERENCE_POSITIVE_COLOR : value < 0 ? DIFFERENCE_NEGATIVE_COLOR : ""
    };
});
</script>
