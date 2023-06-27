<template>
    <l-control position="bottomright">
        <div class="legend-container">
            <map-adjust-scale class="legend-element legend-adjust map-control" name="colour" :step="colourScaleStep"
                              :show="showAdjust" :scale="colourScale" @update="update" :metadata="metadata">
            </map-adjust-scale>
            <div class="legend-element map-control p-3">
            <label v-if="metadata">{{metadata.name}}</label>
                <div class="legend" v-for="(level, index) in levels" v-bind:key="index">
                    <i v-bind:style="level.style"></i>
                    <span class="level">{{ level.val }}</span>
                    <span class="hidden" style="display: none">{{ level.style }}</span>
                    <br/>
                </div>
                <div v-if="adjustable" class="adjust-scale mt-1">
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
    import { defineComponentVue2WithProps } from "../../defineComponentVue2/defineComponentVue2";
    import {LControl} from "@vue-leaflet/vue-leaflet";
    import {
        colorFunctionFromName,
        scaleStepFromMetadata,
        roundToContext,
        formatOutput,
        formatLegend
    } from "./utils";
    import {ChoroplethIndicatorMetadata} from "../../generated";
    import {ScaleSettings} from "../../store/plottingSelections/plottingSelections";
    import MapAdjustScale from "./MapAdjustScale.vue";
    import {NumericRange} from "../../types";

    interface Props {
        metadata: ChoroplethIndicatorMetadata | undefined,
        colourScale: ScaleSettings| null,
        colourRange: NumericRange
    }

    interface Level {
        val: number | string,
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
        update: (scale: ScaleSettings) => void
    }

    export default defineComponentVue2WithProps<Data, Methods, Computed, Props>({
        name: "MapLegend",
        props: {
            metadata: {
                type: Object,
                required: false
            },
            colourScale: {
                type: Object,
                required: true
            },
            colourRange: {
                type: Object,
                required: true
            }
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
            adjustable: function () {
                return !!this.colourScale;
            },
            colourScaleStep: function () {
                return this.metadata ? scaleStepFromMetadata(this.metadata) : 1;
            },
            levels: function () {
                if (this.metadata) {
                    const { format, scale, accuracy} = this.metadata;
                    const max = this.colourRange.max;
                    const min = this.colourRange.min;

                    const colorFunction = colorFunctionFromName(this.metadata.colour);
                    const step = (max - min) / 5;

                    const indexes = max == min ? [0] : [5, 4, 3, 2, 1, 0];

                    const invertScale = this.metadata.invert_scale
                    return indexes.map((i) => {
                        let val: any = min + (i * step);
                        val = roundToContext(val, [min, max]);

                        let valAsProportion = (max != min) ? (val - min) / (max - min) : 0;

                        if (invertScale) {
                            valAsProportion = 1 - valAsProportion;
                        }

                        val = formatLegend(val, format, scale)

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
            update: function (scale: ScaleSettings) {
                this.$emit("update", scale);
            }
        }
    });
</script>
