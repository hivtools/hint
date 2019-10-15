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
    import {colorFunctionFromName} from "../../store/filteredData/utils";

    export default Vue.extend({
        name: "MapLegend",
        props: {
            "metadata": Object
        },
        components: {
            LControl
        },
        computed: {
            levels: function () {
                if (this.metadata) {
                    const max = this.metadata.max;
                    const min = this.metadata.min;
                    const colorFunction = colorFunctionFromName(this.metadata.colour);
                    const step = (max - min) / 5;

                    //Allow levels to have 1 more decimal place than max value
                    const maxFraction = max.toString().split(".");
                    const maxDecPl = maxFraction.length > 1 ? maxFraction[1].length : 0;
                    const roundingNum = Math.pow(10, maxDecPl + 1);

                    return [0, 1, 2, 3, 4, 5].map((i) => {
                        const val = Math.round((min + (i * step)) * roundingNum) / roundingNum;
                        let valAsProportion = (val - min) / (max - min);
                        if (this.metadata.invert_scale) {
                            valAsProportion = 1 - valAsProportion;
                        }
                        return {
                            val, style: {background: colorFunction(valAsProportion)}
                        }
                    });
                }
                return {};
            }
        }
    });
</script>