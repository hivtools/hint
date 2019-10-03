<template>
    <l-control position="bottomright">
        <div class="map-control p-3">
            <div class="legend" v-for="level in levels" v-bind:key="level.val">
                <i v-bind:style="level.style"></i>
                <span class="level">{{level.val}}</span>
                <span class="hidden" style="display: none">{{level.style}}</span>
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
        props: {
            "colorFunction": Function,
            "max": Number,
            "min": Number
        },
        components: {
            LControl
        },
        computed: {
            levels: function () {
                const step = (this.max - this.min) / 5;
                return [0, 1, 2, 3, 4, 5].map((i) => {
                    const val = Math.round((this.min + (i * step)) * 100)/100;
                    return {
                        val, style: {background: this.colorFunction((val - this.min)/(this.max - this.min))}
                    }
                });
            }
        }
    });
</script>