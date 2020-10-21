<template>
    <l-control position="bottomleft">
        <div class="map-control p-1">
            <svg :width="width" :height="height">
                <circle v-for="(circle, index) in circles" :key="'circle-' + index" stroke="#aaa" stroke-width="1"
                        fill-opacity="0"
                        :r="circle.radius" :cx="midX" :cy="circle.y"></circle>
                <text v-for="(circle, index) in circles" :key="'text-' + index" text-anchor="middle"
                      :x="midX" :y="circle.textY">{{ circle.text }}
                </text>
            </svg>
        </div>
    </l-control>
</template>

<script lang="ts">
    import Vue from "vue";
    import {LControl} from "vue2-leaflet";
    import {getRadius} from "./utils";
    import {NumericRange} from "../../../types";
    import numeral from "numeral";

    interface Circle {
        y: number,
        radius: number,
        text: string,
        textY: number
    }

    interface Data {
        steps: number[]
    }

    interface Props {
        indicatorRange: NumericRange,
        minRadius: number,
        maxRadius: number
    }

    interface Computed {
        circles: Circle[],
        width: number,
        height: number,
        midX: number
    }

    interface Methods {
        circleFromRadius: (r: number, value: number, under: boolean) => Circle,
        valueScalePointFromRadius: (r: number) => number
        valueFromValueScalePoint: (valueScalePoint: number) => number
    }

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "SizeLegend",
        props: {
            "indicatorRange": Object,
            "minRadius": Number,
            "maxRadius": Number
        },
        components: {
            LControl
        },
        data: function () {
            return {
                steps: [0.1, 0.25, 0.5, 1]
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
            }
        },
        methods: {
            circleFromRadius: function (r: number, value: number, under = false) {
                const y = this.height - r;

                let text = value > 1000 ? numeral(value).format("0.0a") : (+value.toFixed(3)).toString();
                if (under && text != "0") {
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
            }
        }
    });
</script>
