<template>
    <!-- stop inheritance of attributes -->
    <svg class="tick">
        <path d="M5 70 L 30 90 L 90 5" :stroke="color" :stroke-width="width"
              fill="none"></path>
    </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    props: {
        color: {
            type: String,
            required: true
        },
        width: {
            type: String,
            required: false,
            default: "15px"
        }
    }
})
</script>