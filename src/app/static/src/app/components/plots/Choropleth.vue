<template>
    <l-map ref="map" :zoom="zoom" :center="center" style="height: 800px; width: 100%">
        <template v-for="feature in currentFeatures">
            <l-geo-json :geojson="feature"
                        :options="options"
                        :optionsStyle="{...style, fillColor: getColorForRegion(feature.properties['area_id'])}">
            </l-geo-json>
        </template>
        <map-control @indicator-changed="onIndicatorChange"
                     @detail-changed="onDetailChange"
                     :indicator="indicator"
                    :artEnabled="artEnabled" :prevEnabled="prevEnabled"></map-control>
        <map-legend :getColor="getColor" :max="max" :min="min"></map-legend>
    </l-map>
</template>
<script lang="ts">
    import Vue from "vue";
    import {mapState} from "vuex";
    import {interpolateCool, interpolateWarm} from "d3-scale-chromatic"
    import {LGeoJson, LMap} from 'vue2-leaflet';
    import {Feature} from "geojson";
    import {Layer} from "leaflet";
    import MapControl from "./MapControl.vue";
    import MapLegend from "./MapLegend.vue";
    import {Indicator} from "../../types";
    import {BaselineState} from "../../store/baseline/baseline";
    import {FilteredDataState} from "../../store/filteredData/filteredData";

    interface Data {
        zoom: number,
        center: number[],
        featuresByLevel: { [k: number]: any },
        style: any,
        indicator: Indicator;
        detail: number;
    }

    export default Vue.extend<Data, any, any, any>({
        name: 'Choropleth',
        components: {
            LMap,
            LGeoJson,
            MapLegend,
            MapControl
        },
        computed: {
            ...mapState<BaselineState>("baseline", {
                features: state => state.shape && state.shape.data.features,
            }),
            ...mapState<FilteredDataState>("filteredData", {
                selectedDataType: state => state.selectedDataType
            }),
            indicatorData: function() {
                return this.$store.getters['filteredData/regionIndicators'];
            },
            colorFunctions: function() {
                return this.$store.getters['filteredData/colorFunctions'];
            },
            currentFeatures: function () {
                return this.featuresByLevel[this.detail || 1]
            },
            getColor: function () {
                return this.colorFunctions[this.indicator];
            },
            min: function() {
                if (this.indicator) {
                    if (this.indicator == "prev") {
                        return this.indicatorData.prevRange.min;
                    }
                    if (this.indicator == "art") {
                        return this.indicatorData.artRange.min;
                    }
                }
            },
            max: function() {
                if (this.indicator) {
                    if (this.indicator == "prev") {
                        return this.indicatorData.prevRange.max;
                    }
                    if (this.indicator == "art") {
                        return this.indicatorData.artRange.max;
                    }
                }
            },
            prevEnabled: function() {
                const result = !!(this.indicatorData.prevRange.min || this.indicatorData.prevRange.max);
                return result;
            },
            artEnabled: function() {
                const result = !!(this.indicatorData.artRange.min || this.indicatorData.artRange.max);
                return result;
            },
            options: function() {
                const indicatorData = this.indicatorData;
                const indicator = this.indicator;
                return {
                    onEachFeature: function onEachFeature(feature: Feature, layer: Layer) {
                        const area_id = feature.properties && feature.properties["area_id"];
                        const area_name = feature.properties && feature.properties["area_name"];
                        const values = indicatorData.indicators[area_id];
                        const value = values && values[indicator] && values[indicator].value;
                        layer.bindPopup(`<div>
                                <strong>${area_name}</strong>
                                <br/>${value}
                            </div>`);
                    }
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
                indicator: "prev",
                detail: 5
            }
        },
        created() {
            this.features.forEach((feature: Feature) => {
                const areas = feature.properties!!["area_id"].split(".");
                const adminLevel = areas.length;
                this.featuresByLevel[adminLevel].push(feature);
            });
        },
        methods: {
            onIndicatorChange: function (newVal: string) {
                this.indicator = newVal;
            },
            onDetailChange: function (newVal: number) {
                this.detail = newVal
            },
            getColorForRegion: function (region: string) {
                let data = this.indicatorData.indicators[region];
                data = data && data[this.indicator];
                data = data && data.color;
                return data;
            }
        },
        watch: {
            selectedDataType: function (newVal) {
                //Update indicator to one which is enabled if required
                if (!this.prevEnabled && this.artEnabled && this.indicator == "prev") {
                    this.indicator = "art";
                } else if (!this.artEnabled && this.prevEnabled && this.indicator == "art") {
                    this.indicator = "prev";
                }
            }
        },
    })
</script>
