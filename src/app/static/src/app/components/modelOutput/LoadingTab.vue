<template>
    <div v-show="loading" class="loading">
        <div class="plot-size">
            <loading-spinner size="lg"/>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import LoadingSpinner from '../LoadingSpinner.vue';

export default defineComponent({
    props: {
        loading: Boolean
    },
    components: {
        LoadingSpinner
    }
});
</script>

<style scoped>
.loading {
    background-color: white;
    opacity: 0.75;
    height: 100%;
    width: 100%;
    position: absolute;
    z-index: 9999;
}

.plot-size {
    width: 100%;
    height: 800px;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>