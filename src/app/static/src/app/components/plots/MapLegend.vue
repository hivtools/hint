<template>
    <l-control position="bottomright">
        <div class="legend-container">
            <map-adjust-scale class="legend-element legend-adjust map-control" :step="colourScaleStep"
                              :show="showAdjust" :colour-scale="colourScale" @update="update">
            </map-adjust-scale>
            <div class="legend-element map-control p-3">
            <label v-if="metadata">{{metadata.name}}</label>
                <div class="legend" v-for="(level, index) in levels" v-bind:key="index">
                    <i v-bind:style="level.style"></i>
                    <span class="level">{{ level.val }}</span>
                    <span class="hidden" style="display: none">{{ level.style }}</span>
                    <br/>
                </div>
                <div v-if="adjustable" id="adjust-scale" class="mt-1">
                    <a @click="toggleAdjust" href="">
                        <span v-if="showAdjust" v-translate="'done'"></span>
                        <span v-if="!showAdjust" v-translate="'adjustScale'"></span>
                    </a>
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
    import {ColourScaleSettings} from "../../store/plottingSelections/plottingSelections";
    import MapAdjustScale from "./MapAdjustScale.vue";
    import {NumericRange} from "../../types";
    import numeral from 'numeral';

    interface Props {
        metadata: ChoroplethIndicatorMetadata,
        colourScale: ColourScaleSettings,
        colourRange: NumericRange
    }

    interface Level {
        val: number,
        style: any
    }

    interface Data {
        showAdjust: boolean
    }

    interface Computed {
        levels: Level[],
        colourScaleStep: number,
        adjustable: boolean
    }

    interface Methods {
        toggleAdjust: (e: Event) => void
        update: (colourScale: ColourScaleSettings) => void
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "MapLegend",
        props: {
            "metadata": Object,
            "colourScale": Object,
            "colourRange": Object
        },
        // mounted(){
        //     console.log('metadata', this.metadata)

        //     console.log('colourScale', this.colourScale)

        //     console.log('colourRange', this.colourRange)
        // },
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
            adjustable: function () {
                return !!this.colourScale;
            },
            colourScaleStep: function () {
                return this.metadata ? colourScaleStepFromMetadata(this.metadata) : 1;
            },
            levels: function () {
                if (this.metadata) {
                    const max = this.colourRange.max;
                    const min = this.colourRange.min;

                    const colorFunction = colorFunctionFromName(this.metadata.colour);
                    const step = (max - min) / 5;

                    const indexes = max == min ? [0] : [5, 4, 3, 2, 1, 0];

                    return indexes.map((i) => {
                        let val: any = min + (i * step);
                        val = roundToContext(val, [min, max]);

                        let valAsProportion = (max != min) ? (val - min) / (max - min) : 0;
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
            toggleAdjust: function (e: Event) {
                e.preventDefault();
                this.showAdjust = !this.showAdjust;
            },
            update: function (colourScale: ColourScaleSettings) {
                this.$emit("update", colourScale);
            }
        }
    });
</script>