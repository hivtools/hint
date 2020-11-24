<template>
    <l-control position="topleft" class="emptyFeature-center">
        <div class="map-control emptyFeature-size px-3 py-2">
            <span class="lead">
                <strong v-translate="'noMapData'"></strong>
            </span>
        </div>
    </l-control>
</template>

<script lang="ts">
    import Vue from "vue";
    import {LControl} from 'vue2-leaflet';

    export default Vue.extend({
        components: {
            LControl
        }
    });
</script>