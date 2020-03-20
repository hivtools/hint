import {ColourScaleType} from "../../store/colourScales/colourScales";
<template>
    <l-control position="bottomright">
        <div class="legend-container">
            <map-adjust-scale class="legend-element legend-adjust map-control" :step="colourScaleStep"
                              :show="showAdjust" :colour-scale="colourScale" @update="update">
            </map-adjust-scale>
            <div class="legend-element map-control p-3">
                <div class="legend" v-for="level in levels" v-bind:key="level.val">
                    <i v-bind:style="level.style"></i>
                    <span class="level">{{level.val}}</span>
                    <span class="hidden" style="display: none">{{level.style}}</span>
                    <br/>
                </div>
                <div v-if="adjustable" id="adjust-scale" class="mt-1">
                    <a @click="toggleAdjust" href="">{{showAdjust ? "Done" : "Adjust scale"}}</a>
                </div>
            </div>
        </div>
    </l-control>
</template>
<script lang="ts">
    import Vue from "vue";
    import {LControl} from 'vue2-leaflet';
    import {
        colorFunctionFromName,
        colourScaleStepFromMetadata,
        roundToContext
    } from "./utils";
    import {ChoroplethIndicatorMetadata} from "../../generated";
    import {ColourScaleSettings, ColourScaleType} from "../../store/plottingSelections/plottingSelections";
    import MapAdjustScale from "./MapAdjustScale.vue";

    var numeral = require('numeral');
    interface Props {
        metadata: ChoroplethIndicatorMetadata,
        colourScale: ColourScaleSettings
    }

    interface Level {
        val: number,
        style: Object
    }

    interface Data {
        showAdjust: Boolean
    }

    interface Computed {
        levels: Level[],
        colourScaleStep: number,
        adjustable: Boolean
    }

    interface Methods {
        toggleAdjust: (e: Event) => void
        update: (colourScale: ColourScaleSettings) => void
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "MapLegend",
        props: {
            "metadata": Object,
            "colourScale": Object
        },
        components: {
            LControl,
            MapAdjustScale
        },
        data(): Data {
            return {
                showAdjust: false
            }
        },
        computed: {
            adjustable: function() {
                return !!this.colourScale;
            },
            colourScaleStep: function() {
                return this.metadata ? colourScaleStepFromMetadata(this.metadata) :1;
            },
            levels: function () {
                if (this.metadata) {
                    //Use custom scale if selected, otherwise use metadata range
                    //This logic will be removed in mrc-1417 when replaced with externally provided range
                    let max = this.metadata.max;
                    let min =  this.metadata.min;
                    if (this.adjustable && this.colourScale.type == ColourScaleType.Custom) {
                        max = this.colourScale.customMax;
                        min = this.colourScale.customMin;
                    }

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
        },
        methods: {
            toggleAdjust: function(e: Event) {
                e.preventDefault();
                this.showAdjust = !this.showAdjust;
            },
            update: function(colourScale: ColourScaleSettings) {
                this.$emit("update", colourScale);
            }
        }
    });
</script>