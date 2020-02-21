<template>
    <div class="row">
        <div :class="hideControls ? 'col-sm-6 col-md-8' : 'col-md-3'">
            <slot></slot>
            <div v-if="!hideControls">
                <h4 v-translate="'filters'"></h4>
                <div id="area-filter" class="form-group">
                    <filter-select :label="areaFilter.label"
                                   :multiple="true"
                                   :options="areaFilterOptions"
                                   :value="getSelectedFilterValues('area')"
                                   @select="onFilterSelect(areaFilter, $event)">
                    </filter-select>
                </div>
                <div :id="'filter-' + filter.id" v-for="filter in nonAreaFilters" class="form-group">
                    <filter-select :value="getSelectedFilterValues(filter.id)"
                                   :multiple="false"
                                   :label="filter.label"
                                   :options="filter.options"
                                   :disabled="filter.options.length==0"
                                   @select="onFilterSelect(filter, $event)"></filter-select>
                </div>
            </div>
        </div>
        <div id="chart" class="col-md-9" v-if="!hideControls">
            <l-map ref="map" style="height: 800px; width: 100%">
                <template v-for="feature in currentFeatures">
                    <l-geo-json ref=""
                                :geojson="feature"
                                :optionsStyle="{...style, fillColor: getColor(feature)}">
                    </l-geo-json>
                </template>
                <map-control :initialDetail=selections.detail
                             :indicator=selections.indicatorId
                             :show-indicators="true"
                             @detail-changed="onDetailChange"
                             @indicator-changed="onIndicatorChange"></map-control>
                <map-legend :metadata="colorIndicator"></map-legend>
            </l-map>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Treeselect from '@riophae/vue-treeselect';
    import {Feature} from "geojson";
    import {LGeoJson, LMap, LTooltip} from "vue2-leaflet";
    import MapControl from "../MapControl.vue";
    import MapLegend from "../MapLegend.vue";
    import FilterSelect from "../FilterSelect.vue";
    import {GeoJSON} from "leaflet";
    import {ChoroplethIndicatorMetadata, FilterOption, NestedFilterOption} from "../../../generated";
    import {ChoroplethSelections} from "../../../store/plottingSelections/plottingSelections";
    import {toIndicatorNameLookup} from "../utils";
    import {getFeatureIndicators} from "./utils";
    import {Dict, Filter, IndicatorValuesDict, LevelLabel, NumericRange} from "../../../types";
    import {flattenOptions, flattenToIdSet} from "../../../utils";
    import {getIndicatorRanges} from "../bubble/utils";


    interface Props {
        features: Feature[],
        featureLevels: LevelLabel[]
        indicators: ChoroplethIndicatorMetadata[],
        chartdata: any[],
        filters: Filter[],
        selections: ChoroplethSelections,
        areaFilterId: string
        hideControls: boolean
    }

    interface Data {
        style: any
    }

    interface Methods {
        updateBounds: () => void,
        showColor: (feature: Feature) => boolean,
        getColor: (feature: Feature) => string,
        getTooltip: (feature: Feature) => string,
        getSelectedFilterValues: (filterId: string) => string[],
        onDetailChange: (newVal: number) => void,
        onIndicatorChange: (newVal: string) => void,
        onFilterSelect: (filter: Filter, selectedOptions: FilterOption[]) => void,
        changeSelections: (newSelections: Partial<ChoroplethSelections>) => void,
        getFeatureFromAreaId: (id: string) => Feature,
        normalizeIndicators: (node: ChoroplethIndicatorMetadata) => any
        initialise: () => void
    }

    interface Computed {
        initialised: boolean,
        indicatorRanges: Dict<NumericRange>,
        featureIndicators: Dict<IndicatorValuesDict>,
        featuresByLevel: { [k: number]: Feature[] },
        currentFeatures: Feature[],
        maxLevel: number,
        indicatorNameLookup: Dict<string>,
        areaFilter: Filter,
        nonAreaFilters: Filter[],
        areaFilterOptions: FilterOption[],
        selectedAreaFilterOptions: FilterOption[],
        flattenedAreas: Dict<NestedFilterOption>,
        selectedAreaFeatures: Feature[],
        countryFilterOption: FilterOption,
        countryFeature: Feature | null,
        colorIndicator: ChoroplethIndicatorMetadata
    }

    const props = {
        features: {
            type: Array
        },
        featureLevels: {
            type: Array
        },
        indicators: {
            type: Array
        },
        chartdata: {
            type: Array
        },
        filters: {
            type: Array
        },
        selections: {
            type: Object
        },
        areaFilterId: {
            type: String
        },
        hideControls: {
            type: Boolean
        }
    };

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "Choropleth",
        components: {
            LMap,
            LGeoJson,
            LTooltip,
            MapControl,
            MapLegend,
            FilterSelect,
            Treeselect
        },
        props: props,
        data(): Data {
            return {
                style: {
                    className: "geojson",
                }
            }
        },
        computed: {
            initialised() {
                const unsetFilters = this.nonAreaFilters.filter((f: Filter) => !this.selections.selectedFilterOptions[f.id]);
                return unsetFilters.length == 0 && this.selections.detail > -1 &&
                    !!this.selections.indicatorId;
            },
            indicatorRanges() {
                return getIndicatorRanges(this.chartdata, this.indicators)
            },
            featureIndicators() {
                const selectedAreaIdSet = flattenToIdSet(this.selectedAreaFilterOptions.map(o => o.id), this.flattenedAreas);
                return getFeatureIndicators(
                    this.chartdata,
                    Array.from(selectedAreaIdSet),
                    this.indicators,
                    this.indicatorRanges,
                    this.nonAreaFilters,
                    this.selections.selectedFilterOptions,
                    [this.selections.indicatorId]
                );
            },
            featuresByLevel() {
                const result = {} as any;
                this.featureLevels.forEach((l: any) => {
                    if (l.display) {
                        result[l.id] = [];
                    }
                });

                this.features.forEach((feature: Feature) => {
                    const adminLevel = parseInt(feature.properties!!["area_level"]); //Country (e.g. "MWI") is level 0
                    if (result[adminLevel]) {
                        result[adminLevel].push(feature);
                    }
                });

                return result;
            },
            maxLevel() {
                const levelNums: number[] = Object.keys(this.featuresByLevel).map(k => parseInt(k));

                return Math.max(...levelNums);
            },
            currentFeatures() {
                return this.featuresByLevel[this.selections.detail]
            },
            indicatorNameLookup() {
                return toIndicatorNameLookup(this.indicators)
            },
            areaFilter() {
                return this.filters.find((f:Filter) => f.id == this.areaFilterId)!!;
            },
            nonAreaFilters() {
                return this.filters.filter((f: Filter) => f.id != this.areaFilterId);
            },
            areaFilterOptions() {
                return this.countryFilterOption ? (this.countryFilterOption as any).children : [];
            },
            selectedAreaFilterOptions() {
                const selectedOptions = this.selections.selectedFilterOptions[this.areaFilterId];
                if (selectedOptions && selectedOptions.length > 0) {
                    return selectedOptions
                }
                return this.countryFilterOption ? [this.countryFilterOption] : [];
            },
            flattenedAreas() {
                return flattenOptions(this.areaFilter.options);
            },
            selectedAreaFeatures(): Feature[] {
                if (this.initialised && this.selectedAreaFilterOptions && this.selectedAreaFilterOptions.length > 0) {
                    return this.selectedAreaFilterOptions.map(o => this.getFeatureFromAreaId(o.id)!!);
                }
                return [];
            },
            countryFilterOption(): FilterOption {
                return this.areaFilter.options[0]
            },
            countryFeature(): Feature | null {
                return this.countryFilterOption ? this.getFeatureFromAreaId(this.countryFilterOption.id)!! : null;
            },
            colorIndicator(): ChoroplethIndicatorMetadata {
                return this.indicators.find(i => i.indicator == this.selections.indicatorId)!!;
            }
        },
        methods: {
            updateBounds: function() {
                const map = this.$refs.map as LMap;
                if (map && map.fitBounds) {
                    map.fitBounds(this.selectedAreaFeatures.map((f: Feature) => new GeoJSON(f).getBounds()) as any);
                }
            },
            showColor(feature: Feature) {
                return !!this.featureIndicators[feature.properties!!.area_id] &&
                    !!this.featureIndicators[feature.properties!!.area_id][this.selections.indicatorId];
            },
            getColor: function(feature: Feature) {
                if (this.showColor(feature))
                {
                    return this.featureIndicators[feature.properties!!.area_id][this.selections.indicatorId].color;
                }
                else
                {
                    //show a lighter grey than the outlines if no data
                    //so unselected regions are still distinguishable
                    return "rgb(200,200,200)";
                }
            },
            getTooltip: function(feature: Feature) {
                const area_id = feature.properties && feature.properties["area_id"];
                const area_name = feature.properties && feature.properties["area_name"];

                const values = this.featureIndicators[area_id];
                const colorIndicator = this.selections.indicatorId;
                const colorValue = values && values[colorIndicator] && values[colorIndicator]!!.value;

                return `<div>
                                <strong>${area_name}</strong>
                                <br/>${colorValue}
                            </div>`;

            },
            getSelectedFilterValues(filterId: string) {
                return (this.selections.selectedFilterOptions[filterId] || []).map(o => o.id);
            },
            onDetailChange: function (newVal: number) {
                this.changeSelections({detail: newVal});
            },
            onIndicatorChange: function(newVal: string) {
                this.changeSelections({indicatorId: newVal});
            },
            onFilterSelect(filter: Filter, selectedOptions: FilterOption[]) {
                const newSelectedFilterOptions = {...this.selections.selectedFilterOptions};
                newSelectedFilterOptions[filter.id] = selectedOptions;

                this.changeSelections({selectedFilterOptions: newSelectedFilterOptions});
            },
            changeSelections(newSelections: Partial<ChoroplethSelections>) {
                this.$emit("update", newSelections)
            },
            getFeatureFromAreaId(areaId: string): Feature {
                return this.features.find((f: Feature) => f.properties!!.area_id == areaId)!!;
            },
            normalizeIndicators(node: ChoroplethIndicatorMetadata) {
                return {id: node.indicator, label: node.name};
            },
            initialise() {
                if (!this.hideControls)
                {
                    if (this.selections.detail < 0) {
                        this.onDetailChange(this.maxLevel);
                    }

                    if (!this.selections.indicatorId || !this.indicators.some(i => i.indicator == this.selections.indicatorId)) {
                        const colorIndicator = this.indicatorNameLookup.prevalence ? "prevalence" : this.indicators[0].indicator;
                        this.changeSelections({indicatorId: colorIndicator});
                    }

                    const existingFilterSels = this.selections.selectedFilterOptions;
                    const refreshSelected = this.nonAreaFilters.reduce((obj: any, current: Filter) => {
                        let newSels = existingFilterSels[current.id] ?
                                existingFilterSels[current.id].filter(o => current.options.indexOf(o) > -1) : [];

                        if (newSels.length == 0) {
                            newSels = current.options.length > 0 ? [current.options[0]] : [];
                        }

                        obj[current.id] = newSels;
                        return obj;
                    }, {} as Dict<FilterOption[]>);
                    //assume area filters remain valid
                    refreshSelected[this.areaFilterId] = this.selections.selectedFilterOptions[this.areaFilterId];

                    this.changeSelections({selectedFilterOptions: refreshSelected});
                }
            }
        },
        watch:
            {
                hideControls: function(newVal: boolean) {
                    if (!newVal) {
                        this.initialise();
                    }
                },
                filters: function() {
                    this.initialise();
                },
                indicators: function() {
                    this.initialise();
                },
                initialised: function(newVal: boolean) {
                    if (newVal) {
                        this.$nextTick(() => { this.updateBounds() });
                    }
                },
                selectedAreaFeatures: function() {
                    if (this.initialised)
                    {
                        this.updateBounds();
                    }
                }
            },
    });
</script>