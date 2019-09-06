<template>
    <l-control position="bottomright">
        <div class="map-control p-3">
            <div class="legend" v-for="level in levels">
                <i v-bind:style="level.style"></i>
                {{level.val}}
                <br/>
            </div>
        </div>
    </l-control>
</template>
<script lang="ts">
    import Vue from "vue";
    import {LControl} from 'vue2-leaflet';

    export default Vue.extend({
        name: "MapLegend",
        props: ["getColor", "max", "min"],
        components: {
            LControl
        },
        computed: {
            levels: function () {
                const step = (this.max - this.min) / 5;
                return [0, 1, 2, 3, 4, 5].map((i) => {
                    const val = this.min + (i * step);
                    return {
                        val, style: {background: this.getColor(val / (this.max - this.min))}
                    }
                });
            }
        }
    });
</script>