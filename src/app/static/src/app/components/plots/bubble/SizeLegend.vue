<template>
    <l-control position="bottomleft">
        <div class="map-control p-1">
            <svg :width="width" :height="height">
                <circle v-for="(circle, index) in circles" :key="'circle-' + index" stroke="#aaa" stroke-width="1" fill-opacity="0"
                        :r="circle.radius" :cx="circle.x" :cy="circle.y"></circle>
                <text v-for="(circle, index) in circles" :key="'text-' + index" text-anchor="middle"
                      :x="circle.textX" :y="circle.textY">{{circle.text}}</text>
            </svg>
        </div>
    </l-control>
</template>

<script lang="ts">
    import Vue from "vue";
    import {LControl} from "vue2-leaflet";
    import {getRadius} from "./utils";
    import {NumericRange} from "../../../types";

    interface Circle {
        x: number
        y: number,
        radius: number,
        text: string,
        textX: number,
        textY: number
    }

    interface Props {
        indicatorRange: NumericRange,
        minRadius: number,
        maxRadius: number
    }

    interface Computed {
        circles: Circle[],
        width: number,
        height: number
    }

    const numeral = require('numeral');

    export default Vue.extend<{}, {}, Computed, Props>({
        name: "SizeLegend",
        props: {
            "indicatorRange": Object,
            "minRadius": Number,
            "maxRadius": Number
        },
        components: {
            LControl
        },
        computed: {
            width: function() {
                return (this.maxRadius * 2) + 2; //leave room for stroke width
            },
            height: function() {
                return (this.maxRadius * 2) + 10; //leave room for the top text
            },
            circles: function() {
                const x = this.width / 2;
                const circleFromRadius = (r: number, value: number, under: boolean = false) => {
                    const y = this.height - r;

                    let text = value > 1000 ? numeral(value).format("0a") : +(value.toFixed(2));
                    if (under && text != "0"){
                        text  = "<" + text;
                    }

                    return {x: x,  y: y, radius: r, text: text, textX: x, textY: y-r}
                };

                //We treat the minimum circle differently, since the smallest radius is actually likely to cover quite
                //a wide range of low outliers, so we show the value for the next pixel up and prefix with '<'
                const nextMinRadius = this.minRadius + 1;
                const valueScalePoint = (Math.pow(nextMinRadius,2) - Math.pow(this.minRadius,2))/
                                            (Math.pow(this.maxRadius, 2) - Math.pow(this.minRadius, 2));
                const nextValue = (valueScalePoint * (this.indicatorRange.max - this.indicatorRange.min))
                                            + this.indicatorRange.min;
                const minCircle = circleFromRadius(this.minRadius, nextValue, true);

                const steps = [0.25, 0.5, 0.75, 1];
                const nonMinCircles =  steps.map((s: number) => {
                    const value = this.indicatorRange.min + (s * (this.indicatorRange.max - this.indicatorRange.min));
                    const r = getRadius(value, this.indicatorRange.min, this.indicatorRange.max, this.minRadius, this.maxRadius);
                    return circleFromRadius(r, value)
                });

                return [minCircle, ...nonMinCircles];
            }
        }
    });
</script >
