<template>
    <l-control position="bottomleft">
        <div class="legend-container">
            <div class="legend-element map-control p-3">
                <label class="text-center pt-1 pb-1 d-block">{{metadata.name}}</label>
                <svg :width="width" :height="height" class="d-block">
                    <circle v-for="(circle, index) in circles" :key="'circle-' + index" stroke="#aaa" stroke-width="1"
                            fill-opacity="0"
                            :r="circle.radius" :cx="midX" :cy="circle.y"></circle>
                    <text v-for="(circle, index) in circles" :key="'text-' + index" text-anchor="middle"
                          :x="midX" :y="circle.textY">{{ circle.text }}
                    </text>
                </svg>
                <div class="adjust-scale mt-1">
                    <a @click="toggleAdjust" href="" class="float-right">
                        <span v-if="showAdjust" v-translate="'done'"></span>
                        <span v-if="!showAdjust" v-translate="'adjustScale'"></span>
                    </a>
                </div>
            </div>
            <map-adjust-scale class="legend-element legend-adjust map-control" name="size" :step="scaleStep"
                              :show="showAdjust" :scale="sizeScale" @update="update" :metadata="metadata"
                              :hide-static-custom="true" :hide-static-default="true">
            </map-adjust-scale>
        </div>
    </l-control>
</template>

<script lang="ts">
    import Vue from "vue";
    import {LControl} from "vue2-leaflet";
    import {getRadius} from "./utils";
    import {NumericRange} from "../../../types";
    import numeral from "numeral";
    import {formatOutput, formatLegend, scaleStepFromMetadata} from "./../utils";
    import {ChoroplethIndicatorMetadata} from "../../../generated";
    import {ScaleSettings} from "../../../store/plottingSelections/plottingSelections";
    import MapAdjustScale from "../MapAdjustScale.vue";

    interface Circle {
        y: number,
        radius: number,
        text: string,
        textY: number
    }

    interface Data {
        steps: number[],
        showAdjust: boolean
    }

    interface Props {
        indicatorRange: NumericRange,
        minRadius: number,
        maxRadius: number,
        metadata: ChoroplethIndicatorMetadata
        sizeScale: ScaleSettings,
    }

    interface Computed {
        circles: Circle[],
        width: number,
        height: number,
        midX: number,
        scaleStep: number,
    }

    interface Methods {
        circleFromRadius: (r: number, value: number, under: boolean) => Circle,
        valueScalePointFromRadius: (r: number) => number
        valueFromValueScalePoint: (valueScalePoint: number) => number,
        toggleAdjust: (e: Event) => void,
        update: (scale: ScaleSettings) => void
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "SizeLegend",
        props: {
            "indicatorRange": Object,
            "minRadius": Number,
            "maxRadius": Number,
            "metadata": Object,
            "sizeScale": Object
        },
        components: {
            LControl,
            MapAdjustScale
        },
        data: function () {
            return {
                steps: [0.1, 0.25, 0.5, 1],
                showAdjust: false
            }
        },
        computed: {
            width: function () {
                return (this.maxRadius * 2) + 2; //leave room for stroke width
            },
            height: function () {
                return (this.maxRadius * 2) + 10; //leave room for the top text
            },
            midX: function () {
                return this.width / 2;
            },
            circles: function () {
                //We treat the minimum circle differently, since the smallest radius is actually likely to cover quite
                //a wide range of low outliers, so we show the value for the next pixel up and prefix with '<'
                const nextMinRadius = this.minRadius + 1;
                const valueScalePoint = this.valueScalePointFromRadius(nextMinRadius);
                const nextValue = this.valueFromValueScalePoint(valueScalePoint);
                const minCircle = this.circleFromRadius(this.minRadius, nextValue, true);

                const nonMinCircles = this.steps.map((s: number) => {
                    const value = this.indicatorRange.min + (s * (this.indicatorRange.max - this.indicatorRange.min));
                    const r = getRadius(value, this.indicatorRange.min, this.indicatorRange.max, this.minRadius, this.maxRadius);
                    return this.circleFromRadius(r, value, false)
                });

                return [minCircle, ...nonMinCircles];
            },
            scaleStep: function () {
                return this.metadata ? scaleStepFromMetadata(this.metadata) : 1;
            },
        },
        methods: {
            circleFromRadius: function (r: number, value: number, under = false) {
                const y = this.height - r;

                const { format, scale, accuracy} = this.metadata;
                let text = formatLegend(value, format, scale)
                const zeros = ['0', '0%', '0.0%', '0.00%']
                if (under && !zeros.includes(text)) {
                    text = "<" + text;
                }

                return {y: y, radius: r, text: text, textY: y - r}
            },
            valueScalePointFromRadius: function (r: number) {
                return (Math.pow(r, 2) - Math.pow(this.minRadius, 2)) /
                    (Math.pow(this.maxRadius, 2) - Math.pow(this.minRadius, 2));
            },
            valueFromValueScalePoint: function (valueScalePoint: number) {
                return (valueScalePoint * (this.indicatorRange.max - this.indicatorRange.min))
                    + this.indicatorRange.min;
            },
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
