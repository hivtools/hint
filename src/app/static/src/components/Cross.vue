<template>
    <svg class="tick">
        <path d="M 10,10 l 90,90 M 100,10 l -90,90" :stroke="color" stroke-width="15"
              fill="none"></path>
    </svg>
</template>

<script lang="ts">
    export default {
        props: ["color"]
    }
</script>