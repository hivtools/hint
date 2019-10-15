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
    import {colorFunctionFromName, roundToContext} from "../../store/filteredData/utils";
    import {IndicatorMetadata} from "../../generated";

    interface Props {
        metadata: IndicatorMetadata
    }

    interface Level {
        val: number,
        style: Object
    }

    interface Computed {
        levels: Level[]
    }

    export default Vue.extend<{}, {}, Computed, Props>({
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

                    return [0, 1, 2, 3, 4, 5].map((i) => {
                        let val = min + (i * step);
                        val = roundToContext(val, max);

                        let valAsProportion = (val - min) / (max - min);
                        if (this.metadata.invert_scale) {
                            valAsProportion = 1 - valAsProportion;
                        }

                        return {
                            val, style: {background: colorFunction(valAsProportion)}
                        }
                    });
                }
                return [];
            }
        }
    });
</script>