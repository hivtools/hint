<template>
    <span class="d-inline-flex">
        <!--Setting a transform to push icon up 1 pixel to align slightly
        better with the bottom of the text. It is still not perfect.-->
        <span v-if="cellData.icon"
              class="cell-icon mr-1"
              :style="{ color: cellData.iconColor, transform: 'translateY(-1px)' }">
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
