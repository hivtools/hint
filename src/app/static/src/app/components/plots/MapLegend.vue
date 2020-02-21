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
    import {roundToContext} from "../../store/surveyAndProgramData/utils";
    import {colorFunctionFromName} from "./utils";
    import {ChoroplethIndicatorMetadata} from "../../generated";
    import {NumericRange} from "../../types";
    var numeral = require('numeral');
    interface Props {
        metadata: ChoroplethIndicatorMetadata,
        range: NumericRange
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
            "metadata": Object,
            "range": Object
        },
        components: {
            LControl
        },
        computed: {
            levels: function () {
                if (this.metadata) {
                    //Use custom range if provided, otherwise use metadata range
                    const max = this.range ? this.range.max : this.metadata.max;
                    const min = this.range ? this.range.min : this.metadata.min;
                    const colorFunction = colorFunctionFromName(this.metadata.colour);
                    const step = (max - min) / 5;

                    return [5, 4, 3, 2, 1, 0].map((i) => {
                        let val = min + (i * step);
                        val = roundToContext(val, max);

                        let valAsProportion = (val - min) / (max - min);
                        if (this.metadata.invert_scale) {
                            valAsProportion = 1 - valAsProportion;
                        }

                        if (val >= 1000) {
                            val = numeral(val).format("0a")
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