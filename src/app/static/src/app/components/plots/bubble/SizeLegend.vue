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
    import {ChoroplethIndicatorMetadata} from "../../../generated";
    import Vue from "vue";
    import {LControl} from "vue2-leaflet";
    import {getRadius} from "./utils";

    interface Circle {
        x: number
        y: number,
        radius: number,
        text: string,
        textX: number,
        textY: number
    }

    interface Props {
        metadata: ChoroplethIndicatorMetadata,
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
        name: "MapLegend",
        props: {
            "metadata": Object,
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
                const circleFromRadius = (r: number, value: number) => {
                    const y = this.height - r;
                    const text = value > 1000 ? numeral(value).format("0a") : value.toString();
                    return {x: x,  y: y, radius: r, text: text, textX: x, textY: y-r}
                };

                const steps = [0, 0.25, 0.5, 0.75, 1];
                return steps.map((s: number) => {
                    const value = this.metadata.min + (s * (this.metadata.max - this.metadata.min));
                    const r = getRadius(value, this.metadata.min, this.metadata.max, this.minRadius, this.maxRadius);
                    return circleFromRadius(r, value)
                });
            }
        }
    });
</script >
