<template>
    <div>Table</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    props: {
        data: Object,
        headerName: String
    }
});
</script>