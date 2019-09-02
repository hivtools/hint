<template>
    <l-map ref="map" :zoom="zoom" :center="center" style="height: 800px; width: 100%">
        <template v-for="feature in currentFeatures">
            <l-geo-json :geojson="feature" :optionsStyle="{...style,
             fillColor: getColorForRegion(feature.properties['area_id'])}"></l-geo-json>
        </template>
        <l-control position="topright">
            <div style="width: 250px;" class="p-3 map-control">
                <form>
                    <div class="row form-group">
                        <label class="col-3 col-form-label">
                            Indicator:
                        </label>
                        <div class="col">
                            <tree-select v-model="indicator" :multiple="false" :options="indicatorOptions">
                            </tree-select>
                        </div>
                    </div>
                    <div class="row form-group">
                        <label class="col-3 col-form-label">
                            Detail:
                        </label>
                        <div class="col">
                            <tree-select v-model="detail" :multiple="false" :options="detailOptions">
                            </tree-select>
                        </div>
                    </div>
                </form>
            </div>
        </l-control>
        <l-control position="bottomright">
            <div class="map-control p-3">
                <div class="legend" v-for="level in levels">
                    <i v-bind:style="level.style"></i>
                    {{level.val}}
                    <br/>
                </div>
            </div>
        </l-control>
    </l-map>
</template>
<script lang="ts">
    import Vue from "vue";
    import {interpolateCool, interpolateWarm} from "d3-scale-chromatic"
    import {LControl, LGeoJson, LMap} from 'vue2-leaflet';
    import {ChoroplethLayer, InfoControl, ReferenceChart} from 'vue-choropleth'
    import axios from "axios"
    import {Feature} from "geojson";
    import TreeSelect from '@riophae/vue-treeselect'

    interface Data {
        zoom: number,
        center: number[],
        adminLevels: any[],
        features: any[],
        featuresByLevel: { [k: number]: any },
        style: any,
        detail: any;
        detailOptions: any[];
        indicator: string,
        indicatorOptions: any[],
        indicatorData: { [k: string]: any },
        max: number;
        min: number;
    }

    export default Vue.extend<Data, any, any, any>({
        name: 'CentroidMap',
        components: {
            LMap,
            LGeoJson,
            LControl,
            TreeSelect,
            'l-info-control': InfoControl,
            'l-reference-chart': ReferenceChart,
            'l-choropleth-layer': ChoroplethLayer
        },
        data(): Data {
            return {
                zoom: 7,
                center: [-13.2543, 34.3015],
                adminLevels: [],
                features: [],
                featuresByLevel: {1: [], 2: [], 3: [], 4: [], 5: [], 6: []},
                style: {
                    weight: 1,
                    fillOpacity: 1.0,
                    color: 'grey'
                },
                detail: 4,
                detailOptions: [
                    {
                        id: 1,
                        label: "Admin level 1"
                    },
                    {
                        id: 2,
                        label: "Admin level 2"
                    },
                    {
                        id: 3,
                        label: "Admin level 3"
                    },
                    {
                        id: 4,
                        label: "Admin level 4"
                    },
                    {
                        id: 5,
                        label: "Admin level 5"
                    }
                ],
                indicator: "prev",
                indicatorOptions: [
                    {id: "prev", label: "prevalence"},
                    {id: "art", label: "ART coverage"}
                ],
                indicatorData: {},
                max: 0.25,
                min: 0.003
            }
        },
        computed: {
            currentFeatures: function () {
                return this.featuresByLevel[this.detail || 1]
            },
            levels: function () {
                const step = (this.max - this.min) / 5;
                return [0, 1, 2, 3, 4, 5].map((i) => {
                    const val = this.min + (i * step);
                    return {
                        val, style: {background: this.getColor(val / (this.max - this.min))}
                    }
                });
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
                            this.adminLevels.push(adminLevel)
                        } else this.featuresByLevel[adminLevel].push(feature);
                    });

                    this.features = response.data.features
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
