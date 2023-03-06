<template>
    <svg class="tick">
        <path d="M5 70 L 30 90 L 90 5" :stroke="color" stroke-width="15"
              fill="none"></path>
    </svg>
</template>

<script lang="ts">
    export default {
        props: ["color", "width"]
    }
</script>