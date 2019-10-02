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
        <map-legend v-if="showLegend" :getColor="getColor" :max="range.max" :min="range.min"></map-legend>
    </l-map>
</template>
<script lang="ts">
    import Vue from "vue";
    import {mapGetters, mapState} from "vuex";
    import {LGeoJson, LMap} from 'vue2-leaflet';
    import {Feature} from "geojson";
    import {Layer} from "leaflet";
    import MapControl from "./MapControl.vue";
    import MapLegend from "./MapLegend.vue";
    import {Indicator} from "../../types";
    import {BaselineState} from "../../store/baseline/baseline";
    import {DataType, FilteredDataState} from "../../store/filteredData/filteredData";

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
            ...mapGetters('filteredData', ["regionIndicators", "colorFunctions", "choroplethRanges"]),
            /*regionIndicators: function() {
                return this.$store.getters['filteredData/regionIndicators'];
            },
            colorFunctions: function() {
                return this.$store.getters['filteredData/colorFunctions'];
            },*/
            currentFeatures: function () {
                return this.featuresByLevel[this.detail || 1]
            },
            getColor: function () {
                return this.colorFunctions[this.indicator];
            },
            showLegend: function() {
              return !!(this.max || this.min);
            },
            /*min: function() {
                if (this.indicator) {
                    if (this.indicator == "prev") {
                        return this.regionIndicators.prevRange.min;
                    }
                    if (this.indicator == "art") {
                        return this.regionIndicators.artRange.min;
                    }
                }
            },
            max: function() {
                if (this.indicator) {
                    if (this.indicator == "prev") {
                        return this.regionIndicators.prevRange.max;
                    }
                    if (this.indicator == "art") {
                        return this.regionIndicators.artRange.max;
                    }
                }
            },*/
            range: function() {
                return this.choroplethRanges[this.indicator];
            },
            prevEnabled: function() {
                return this.selectedDataType != DataType.Program;
            },
            artEnabled: function() {

                return this.selectedDataType == DataType.Survey || this.selectedDataType == DataType.Program;
            },
            options: function() {
                const regionIndicators = this.regionIndicators;
                const indicator = this.indicator;
                return {
                    onEachFeature: function onEachFeature(feature: Feature, layer: Layer) {
                        const area_id = feature.properties && feature.properties["area_id"];
                        const area_name = feature.properties && feature.properties["area_name"];
                        const values = regionIndicators.indicators[area_id];
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
                alert("region indicators: " + JSON.stringify(this.regionIndicators));
                let data = this.regionIndicators[region];
                data = data && data[this.indicator];
                data = data && data.color;
                alert("got color: " + JSON.stringify(data));
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
