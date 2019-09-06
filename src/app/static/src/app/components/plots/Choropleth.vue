<template>
    <l-map ref="map" :zoom="zoom" :center="center" style="height: 800px; width: 100%">
        <template v-for="feature in currentFeatures">
            <l-geo-json :geojson="feature"
                        :optionsStyle="{...style, fillColor: getColorForRegion(feature.properties['area_id'])}">
            </l-geo-json>
        </template>
        <map-control></map-control>
        <map-legend :getColor="getColor" :max="max" :min="min"></map-legend>
    </l-map>
</template>
<script lang="ts">
    import Vue from "vue";
    import {interpolateCool, interpolateWarm} from "d3-scale-chromatic"
    import {LControl, LGeoJson, LMap} from 'vue2-leaflet';
    import axios from "axios"
    import {Feature} from "geojson";
    import MapControl from "./MapControl.vue";
    import MapLegend from "./MapLegend.vue";

    interface Data {
        zoom: number,
        center: number[],
        featuresByLevel: { [k: number]: any },
        style: any,
        indicatorData: { [k: string]: any },
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
        data(): Data {
            return {
                zoom: 7,
                center: [-13.2543, 34.3015],
                featuresByLevel: {1: [], 2: [], 3: [], 4: [], 5: [], 6: []},
                style: {
                    weight: 1,
                    fillOpacity: 1.0,
                    color: 'grey'
                },
                indicatorData: {},
                max: 0.25,
                min: 0.003
            }
        },
        computed: {
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
        created() {
            axios.get('https://raw.githubusercontent.com/mrc-ide/hintr/master/tests/testthat/testdata/malawi.geojson')
                .then((response) => {
                    response.data.features.forEach((feature: Feature) => {
                        const areas = feature.properties!!["area_id"].split(".");
                        const adminLevel = areas.length;
                        if (!this.featuresByLevel[adminLevel]) {
                            this.featuresByLevel[adminLevel] = [feature];
                        } else this.featuresByLevel[adminLevel].push(feature);
                    });
                });

            axios.get('public/testdata/prev.json')
                .then(response => {
                    this.indicatorData = response.data
                })
        },
        watch: {
            indicator: function (val) {
                if (val) {
                    axios.get(`public/testdata/${val}.json`)
                        .then(response => {
                            this.indicatorData = response.data;
                            if (val == "prev") {
                                this.min = 0.03;
                                this.max = 0.25;
                            }
                            if (val == "art") {
                                this.min = 2000;
                                this.max = 70000;
                            }
                        });
                }
            }
        },
        methods: {
            getColorForRegion: function (region: string) {
                const data = parseFloat(this.indicatorData[region]) / (this.max - this.min);
                return this.getColor(data);
            }
        }
    })
</script>
