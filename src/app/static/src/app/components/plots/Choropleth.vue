<template>
    <l-map ref="map" :zoom="zoom" :center="center" style="height: 800px; width: 100%">
        <template v-for="feature in currentFeatures">
            <l-geo-json :geojson="feature"
                        :optionsStyle="{...style, fillColor: getColorForRegion(feature.properties['area_id'])}">
            </l-geo-json>
        </template>
        <map-control @indicator-changed="onIndicatorChange"
                     @detail-changed="onDetailChange"></map-control>
        <map-legend :getColor="getColor" :max="max" :min="min"></map-legend>
    </l-map>
</template>
<script lang="ts">
    import Vue from "vue";
    import {mapState} from "vuex";
    import {interpolateCool, interpolateWarm} from "d3-scale-chromatic"
    import {LControl, LGeoJson, LMap} from 'vue2-leaflet';
    import axios from "axios"
    import {Feature} from "geojson";
    import MapControl from "./MapControl.vue";
    import MapLegend from "./MapLegend.vue";
    import {Indicator} from "../../types";
    import {BaselineState} from "../../store/baseline/baseline";

    interface Data {
        zoom: number,
        center: number[],
        featuresByLevel: { [k: number]: any },
        style: any,
        indicatorData: { [k: string]: any },
        indicator: Indicator;
        detail: number;
        max: number;
        min: number;
    }

    export default Vue.extend<Data, any, any, any>({
        name: 'Choropleth',
        components: {
            LMap,
            LGeoJson,
            LControl,
            MapLegend,
            MapControl
        },
        computed: {
            ...mapState<BaselineState>("baseline", {
                features: state => state.shape && state.shape.data.features
            }),
            currentFeatures: function () {
                return this.featuresByLevel[this.detail || 1]
            },
            getColor: function () {
                if (this.indicator == "prev") {
                    return interpolateCool
                } else {
                    return interpolateWarm
                }
            }
        },
        data(): Data {
            return {
                zoom: 7, // TODO: will this always be appropriate?
                center: [-13.2543, 34.3015], // TODO: this is hardcoded to Malawi! where will this come from?
                featuresByLevel: {1: [], 2: [], 3: [], 4: [], 5: [], 6: []},
                style: {
                    weight: 1,
                    fillOpacity: 1.0,
                    color: 'grey'
                },
                indicatorData: {},
                indicator: "prev",
                detail: 4,
                max: 0.25,
                min: 0.003
            }
        },
        created() {
            // TODO this data should come from the store
            // and be a dictionary of all region ids to
            // required indicators, already filtered/aggregated
            axios.get('public/testdata/indicators.json')
                .then(response => {
                    this.indicatorData = response.data
                });

            this.features.forEach((feature: Feature) => {
                const areas = feature.properties!!["area_id"].split(".");
                const adminLevel = areas.length;
                this.featuresByLevel[adminLevel].push(feature);
            });
        },
        methods: {
            onIndicatorChange: function (newVal: string) {
                if (newVal) {
                    if (newVal == "prev") {
                        this.min = 0.03;
                        this.max = 0.25;
                    }
                    if (newVal == "art") {
                        this.min = 0.13;
                        this.max = 0.35;
                    }
                }
                this.indicator = newVal
            },
            onDetailChange: function (newVal: number) {
                this.detail = newVal
            },
            getColorForRegion: function (region: string) {
                let data = this.indicatorData[region];
                data = data && data[this.indicator];
                data = data && parseFloat(data) / (this.max - this.min);
                return this.getColor(data);
            }
        }
    })
</script>
