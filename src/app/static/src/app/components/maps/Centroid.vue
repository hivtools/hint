<template>
    <l-map ref="map" v-for="feature in features">
        <l-geo-json :geojson="feature"></l-geo-json>
    </l-map>
</template>
<script lang="ts">
    import Vue from "vue";
    import {LGeoJson, LMap, LMarker, LTileLayer} from 'vue2-leaflet';
    import axios from "axios"
    import {Feature} from "geojson";

    export default Vue.extend({
        name: 'CentroidMap',
        components: {
            LMap,
            LTileLayer,
            LMarker,
            LGeoJson
        },
        data() {
            return {
                zoom: 7,
                center: [-13.2543, 34.3015],
                regions: [],
                features: []
            }
        },
        created() {
            axios.get('https://raw.githubusercontent.com/r-ash/r-ash.github.io/master/data/malawi.geojson')
                .then((response) => {
                    this.regions = response.data.reduce((acc: [], curr: Feature) =>
                        acc.some(x => x === curr.properties!!.region)? acc: [...acc, curr ])

                    this.features = response.data.features
                })
        }
    })
</script>
