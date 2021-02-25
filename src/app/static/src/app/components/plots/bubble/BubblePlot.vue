<template>
    <div class="row">
        <div class="col-md-3">
            <div id="color-indicator" class="form-group">
                <label class="font-weight-bold" v-translate="'colorIndicator'"></label>
                <treeselect :multiple=false
                            :clearable="false"
                            :options="indicators"
                            v-model="selections.colorIndicatorId"
                            :normalizer="normalizeIndicators"
                            @input="onColorIndicatorSelect($event)">
                </treeselect>
            </div>
            <div id="size-indicator" class="form-group">
                <label class="font-weight-bold" v-translate="'sizeIndicator'"></label>
                <treeselect :multiple=false
                            :clearable="false"
                            :options="indicators"
                            v-model="selections.sizeIndicatorId"
                            :normalizer="normalizeIndicators"
                            @input="onSizeIndicatorSelect($event)">
                </treeselect>
            </div>
            <h4 v-translate="'filters'"></h4>
            <div id="area-filter" class="form-group">
                <filter-select :label="areaFilter.label"
                               :multiple="true"
                               :options="areaFilterOptions"
                               :value="getSelectedFilterValues('area')"
                               @select="onFilterSelect(areaFilter, $event)">
                </filter-select>
            </div>
            <div :id="'filter-' + filter.id" v-for="filter in nonAreaFilters" :key="filter.id" class="form-group">
                <filter-select :value="getSelectedFilterValues(filter.id)"
                               :multiple="false"
                               :label="filter.label"
                               :options="filter.options"
                               @select="onFilterSelect(filter, $event)"></filter-select>
            </div>
        </div>
        <div id="chart" class="col-md-9">
            <l-map ref="map" style="height: 800px; width: 100%">
                <template v-for="feature in currentFeatures">
                    <l-geo-json :key="feature.id"
                                ref=""
                                :geojson="feature"
                                :optionsStyle="style">
                    </l-geo-json>
                    <l-circle-marker v-if="showBubble(feature)"
                                     :key="feature.id"
                                     :lat-lng="[feature.properties.center_y, feature.properties.center_x]"
                                     :radius="getRadius(feature)"
                                     :fill-opacity="0.75"
                                     :opacity="0.75"
                                     :color="getColor(feature)"
                                     :fill-color="getColor(feature)">
                        <l-tooltip :content="getTooltip(feature)"/>
                    </l-circle-marker>
                </template>
                <map-empty-feature v-if="emptyFeature"></map-empty-feature>
                <reset-map v-else @reset-view="updateBounds"></reset-map>
                <map-control :initialDetail=selections.detail
                             :show-indicators="false"
                             :level-labels="featureLevels"
                             @detail-changed="onDetailChange"></map-control>
                <map-legend v-show="!emptyFeature"
                            :metadata="colorIndicator"
                            :colour-range="colourRange"
                            :colour-scale="colourIndicatorScale"
                            @update="updateColourScale"
                ></map-legend>
                <size-legend v-show="!emptyFeature"
                             :indicatorRange="sizeRange"
                             :max-radius="maxRadius"
                             :min-radius="minRadius"
                             :metadata="sizeIndicator"
                             :size-scale="sizeIndicatorScale"
                             @update="updateSizeScale"
                ></size-legend>
            </l-map>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Treeselect from '@riophae/vue-treeselect';
    import {Feature} from "geojson";
    import {LCircleMarker, LGeoJson, LMap, LTooltip} from "vue2-leaflet";
    import MapControl from "../MapControl.vue";
    import MapLegend from "../MapLegend.vue";
    import FilterSelect from "../FilterSelect.vue";
    import {GeoJSON} from "leaflet";
    import {ChoroplethIndicatorMetadata, FilterOption, NestedFilterOption} from "../../../generated";
    import {
        BubblePlotSelections,
        ScaleSelections,
        ScaleSettings,
        ScaleType
    } from "../../../store/plottingSelections/plottingSelections";
    import {getFeatureIndicators} from "./utils";
    import {getIndicatorRange, toIndicatorNameLookup, formatOutput} from "../utils";
    import {BubbleIndicatorValuesDict, Dict, Filter, LevelLabel, NumericRange} from "../../../types";
    import {flattenOptions, flattenToIdSet} from "../../../utils";
    import SizeLegend from "./SizeLegend.vue";
    import {initialiseScaleFromMetadata} from "../choropleth/utils";
    import MapEmptyFeature from "../MapEmptyFeature.vue";
    import ResetMap from "../ResetMap.vue";


    interface Props {
        features: Feature[],
        featureLevels: LevelLabel[]
        indicators: ChoroplethIndicatorMetadata[],
        chartdata: any[],
        filters: Filter[],
        selections: BubblePlotSelections,
        areaFilterId: string,
        colourScales: ScaleSelections,
        sizeScales: ScaleSelections
    }

    interface Data {
        style: any,
        maxRadius: number,
        minRadius: number,
        fullIndicatorRanges: Dict<NumericRange>
    }

    interface Methods {
        updateBounds: () => void,
        showBubble: (feature: Feature) => boolean,
        getRadius: (feature: Feature) => number,
        getColor: (feature: Feature) => string,
        getTooltip: (feature: Feature) => string,
        getSelectedFilterValues: (filterId: string) => string[],
        onDetailChange: (newVal: number) => void,
        onFilterSelect: (filter: Filter, selectedOptions: FilterOption[]) => void,
        onColorIndicatorSelect: (newValue: string) => void,
        onSizeIndicatorSelect: (newValue: string) => void,
        changeSelections: (newSelections: Partial<BubblePlotSelections>) => void,
        getFeatureFromAreaId: (id: string) => Feature,
        normalizeIndicators: (node: ChoroplethIndicatorMetadata) => any,
        updateColourScale: (scale: ScaleSettings) => void,
        updateSizeScale: (scale: ScaleSettings) => void,
        getRange: (indicator: ChoroplethIndicatorMetadata, scale: ScaleSettings) => NumericRange
    }

    interface Computed {
        initialised: boolean,
        currentLevelFeatureIds: string[],
        featureIndicators: BubbleIndicatorValuesDict,
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
        sizeIndicator: ChoroplethIndicatorMetadata,
        colorIndicator: ChoroplethIndicatorMetadata,
        sizeRange: NumericRange,
        colourRange: NumericRange,
        colourIndicatorScale: ScaleSettings | null
        sizeIndicatorScale: ScaleSettings | null
        selectedAreaIds: string[]
        emptyFeature: boolean
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
        colourScales: {
            type: Object
        },
        sizeScales: {
            type: Object
        }
    };

    export default Vue.extend<Data, Methods, Computed, Props>({
        name: "BubblePlot",
        components: {
            LMap,
            LGeoJson,
            LCircleMarker,
            LTooltip,
            MapControl,
            MapLegend,
            SizeLegend,
            FilterSelect,
            Treeselect,
            MapEmptyFeature,
            ResetMap
        },
        props: props,
        data(): Data {
            return {
                style: {
                    className: "geojson-grey",
                },
                maxRadius: 70,
                minRadius: 10,
                fullIndicatorRanges: {}
            }
        },
        computed: {
            initialised() {
                const unsetFilters = this.nonAreaFilters.filter((f: Filter) => !this.selections.selectedFilterOptions[f.id]);
                return unsetFilters.length == 0 && this.selections.detail > -1 &&
                    !!this.selections.colorIndicatorId && !!this.selections.sizeIndicatorId;
            },
            currentLevelFeatureIds() {
                return this.currentFeatures.map(f => f.properties!["area_id"]);
            },
            emptyFeature() {
                const nonEmptyFeature = (this.currentFeatures.filter(filtered => !!this.featureIndicators[filtered.properties!.area_id]))
                return nonEmptyFeature.length == 0
            },
            sizeRange() {
                const sizeScale = this.sizeScales[this.selections.sizeIndicatorId];
                return this.getRange(this.sizeIndicator, sizeScale);
            },
            colourRange() {
                const colourScale = this.colourScales[this.selections.colorIndicatorId];
                return this.getRange(this.colorIndicator, colourScale);
            },
            selectedAreaIds() {
                const selectedAreaIdSet = flattenToIdSet(this.selectedAreaFilterOptions.map(o => o.id), this.flattenedAreas);
                return Array.from(selectedAreaIdSet)
            },
            featureIndicators() {
                if (!this.initialised) {
                    return {}
                }
                return getFeatureIndicators(
                    this.chartdata,
                    this.selectedAreaIds,
                    this.sizeIndicator,
                    this.colorIndicator,
                    this.sizeRange,
                    this.colourRange,
                    this.nonAreaFilters,
                    this.selections.selectedFilterOptions,
                    this.minRadius,
                    this.maxRadius
                );
            },
            featuresByLevel() {
                //TODO: this is shared with choropleth, could move into utils file or Mixin
                const result = {} as any;
                this.featureLevels.forEach((l: any) => {
                    if (l.display) {
                        result[l.id] = [];
                    }
                });

                this.features.forEach((feature: Feature) => {
                    const adminLevel = parseInt(feature.properties!["area_level"]); //Country (e.g. "MWI") is level 0
                    if (result[adminLevel]) {
                        result[adminLevel].push(feature);
                    }
                });

                return result;
            },
            maxLevel() {
                //TODO: this is shared with choropleth, could move into utils file or Mixin
                const levelNums: number[] = Object.keys(this.featuresByLevel).map(k => parseInt(k));

                return Math.max(...levelNums);
            },
            currentFeatures() {
                return this.featuresByLevel[this.selections.detail] || [];
            },
            indicatorNameLookup() {
                return toIndicatorNameLookup(this.indicators)
            },
            areaFilter() {
                return this.filters.find((f: Filter) => f.id == this.areaFilterId)!;
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
                if (this.selectedAreaFilterOptions && this.selectedAreaFilterOptions.length > 0) {
                    return this.selectedAreaFilterOptions.map(o => this.getFeatureFromAreaId(o.id)!);
                }
                return [];
            },
            countryFilterOption(): FilterOption {
                return this.areaFilter.options[0]
            },
            countryFeature(): Feature | null {
                return this.countryFilterOption ? this.getFeatureFromAreaId(this.countryFilterOption.id)! : null;
            },
            colorIndicator(): ChoroplethIndicatorMetadata {
                return this.indicators.find(i => i.indicator == this.selections.colorIndicatorId)!;
            },
            sizeIndicator(): ChoroplethIndicatorMetadata {
                return this.indicators.find(i => i.indicator == this.selections.sizeIndicatorId)!;
            },
            colourIndicatorScale(): ScaleSettings | null {
                const current = this.colourScales[this.selections.colorIndicatorId];
                if (current) {
                    return current
                } else {
                    const newScale = initialiseScaleFromMetadata(this.colorIndicator);
                    this.updateColourScale(newScale);
                    return newScale;
                }
            },
            sizeIndicatorScale(): ScaleSettings | null {
                const current = this.sizeScales[this.selections.sizeIndicatorId];
                if (current) {
                    return current
                } else {
                    const newScale = initialiseScaleFromMetadata(this.sizeIndicator);
                    this.updateSizeScale(newScale);
                    return newScale;
                }
            }
        },
        methods: {
            updateBounds: function () {
                if (this.initialised) {
                    const map = this.$refs.map as LMap;
                    if (map && map.fitBounds) {
                        map.fitBounds(this.selectedAreaFeatures.map((f: Feature) => new GeoJSON(f).getBounds()) as any);
                    }
                }
            },
            showBubble(feature: Feature) {
                return !!this.featureIndicators[feature.properties!.area_id] &&
                    !!this.featureIndicators[feature.properties!.area_id]
                    && !!this.featureIndicators[feature.properties!.area_id].value
                    && !!this.featureIndicators[feature.properties!.area_id].sizeValue
            },
            getRadius: function (feature: Feature) {
                return this.featureIndicators[feature.properties!.area_id].radius;
            },
            getColor: function (feature: Feature) {
                return this.featureIndicators[feature.properties!.area_id].color;
            },
            getTooltip: function (feature: Feature) {
                const area_id = feature.properties && feature.properties["area_id"];
                const area_name = feature.properties && feature.properties["area_name"];

                const values = this.featureIndicators[area_id];
                const colorIndicator = this.selections.colorIndicatorId;
                const sizeIndicator = this.selections.sizeIndicatorId;
                const colorValue = values && values!.value;
                const {sizeValue, lower_value, upper_value, sizeLower, sizeUpper} = values!;

                const colorIndicatorName = this.indicatorNameLookup[colorIndicator];
                const sizeIndicatorName = this.indicatorNameLookup[sizeIndicator];
                const { format, scale, accuracy } = this.colorIndicator!;
                const { format: formatS, scale: scaleS, accuracy: accuracyS } = this.sizeIndicator!;

                const stringLower_value = (lower_value || lower_value === 0) ? lower_value.toString() : "";
                const stringUpper_value = (upper_value || upper_value === 0) ? upper_value.toString() : "";
                const stringSizeUpper = (sizeUpper || sizeUpper === 0) ? sizeUpper.toString() : "";
                const stringSizeLower = (sizeLower || sizeLower === 0) ? sizeLower.toString() : "";

                if ((stringLower_value && stringUpper_value) && (stringSizeLower && stringSizeUpper)) {
                    return `<div>
                                <strong>${area_name}</strong>
                                <br/>${colorIndicatorName}: ${formatOutput(colorValue, format, scale, accuracy)}
                                <br/>(${formatOutput(stringLower_value, format, scale, accuracy) + " - " +
                    formatOutput(stringUpper_value, format, scale, accuracy)})
                                <br/>
                                <br/>${sizeIndicatorName}: ${formatOutput(sizeValue, formatS, scaleS, accuracyS)}
                                <br/>(${formatOutput(stringSizeLower, formatS, scaleS, accuracyS) + " - " +
                    formatOutput(stringSizeUpper, formatS, scaleS, accuracyS)})
                            </div>`;
                }
                return `<div>
                                <strong>${area_name}</strong>
                                <br/>${colorIndicatorName}: ${formatOutput(colorValue, format, scale, accuracy)}
                                <br/>${sizeIndicatorName}: ${formatOutput(sizeValue, formatS, scaleS, accuracyS)}
                            </div>`;
            },
            getSelectedFilterValues(filterId: string) {
                return (this.selections.selectedFilterOptions[filterId] || []).map(o => o.id);
            },
            getRange(indicator: ChoroplethIndicatorMetadata, scale: ScaleSettings) {
                if (!this.initialised) {
                    return {max: 1, min: 0}
                }
                const indicatorId = indicator.indicator;
                const type = scale && scale.type;
                switch (type) {
                    case  ScaleType.DynamicFull:
                        if (!this.fullIndicatorRanges.hasOwnProperty(indicatorId)) {
                            // cache the result in the fullIndicatorRanges object for future lookups
                            /* eslint vue/no-side-effects-in-computed-properties: "off" */
                            this.fullIndicatorRanges[indicatorId] =
                                getIndicatorRange(this.chartdata, indicator)
                        }
                        return this.fullIndicatorRanges[indicatorId];
                    case ScaleType.DynamicFiltered:
                        return getIndicatorRange(
                            this.chartdata,
                            indicator,
                            this.nonAreaFilters,
                            this.selections.selectedFilterOptions,
                            this.selectedAreaIds.filter(a => this.currentLevelFeatureIds.indexOf(a) > -1)
                        );
                    case ScaleType.Custom:
                        return {
                            min: scale.customMin,
                            max: scale.customMax
                        };
                    case ScaleType.Default:
                    default:
                        return {max: indicator.max, min: indicator.min}
                }
            },
            onDetailChange: function (newVal: number) {
                this.changeSelections({detail: newVal});
            },
            onFilterSelect(filter: Filter, selectedOptions: FilterOption[]) {
                const newSelectedFilterOptions = {...this.selections.selectedFilterOptions};
                newSelectedFilterOptions[filter.id] = selectedOptions;

                this.changeSelections({selectedFilterOptions: newSelectedFilterOptions});
            },
            onColorIndicatorSelect(newValue: string) {
                this.changeSelections({colorIndicatorId: newValue});
            },
            onSizeIndicatorSelect(newValue: string) {
                this.changeSelections({sizeIndicatorId: newValue});
            },
            changeSelections(newSelections: Partial<BubblePlotSelections>) {
                this.$emit("update", newSelections)
            },
            getFeatureFromAreaId(areaId: string): Feature {
                return this.features.find((f: Feature) => f.properties!.area_id == areaId)!;
            },
            normalizeIndicators(node: ChoroplethIndicatorMetadata) {
                return {id: node.indicator, label: node.name};
            },
            updateColourScale: function (scale: ScaleSettings) {
                const newColourScales = {...this.colourScales};
                newColourScales[this.selections.colorIndicatorId] = scale;
                this.$emit("update-colour-scales", newColourScales);
            },
            updateSizeScale: function (scale: ScaleSettings) {
                const newSizeScales = {...this.sizeScales};
                newSizeScales[this.selections.sizeIndicatorId] = scale;
                this.$emit("update-size-scales", newSizeScales);
            },
        },
        watch:
            {
                initialised: function (newVal: boolean) {
                    this.updateBounds();
                },
                selectedAreaFeatures: function (newVal) {
                    this.updateBounds();
                }
            },
        mounted() {
            this.updateBounds();
        },
        created() {
            //If selections have not been initialised, refresh them
            if (this.selections.detail < 0) {
                this.onDetailChange(this.maxLevel);
            }

            if (!this.selections.colorIndicatorId) {
                const colorIndicator = this.indicatorNameLookup.prevalence ? "prevalence" : this.indicators[0].indicator;
                this.changeSelections({colorIndicatorId: colorIndicator});
            }
            if (!this.selections.sizeIndicatorId) {
                const sizeIndicator = this.indicatorNameLookup.plhiv ? "plhiv" : this.indicators[0].indicator;
                this.changeSelections({sizeIndicatorId: sizeIndicator});
            }

            if (Object.keys(this.selections.selectedFilterOptions).length < 1) {
                const defaultSelected = this.nonAreaFilters.reduce((obj: any, current: Filter) => {
                    obj[current.id] = current.options.length > 0 ? [current.options[0]] : [];
                    return obj;
                }, {} as Dict<FilterOption[]>);
                this.changeSelections({selectedFilterOptions: defaultSelected});
            }
        },
    });
</script>
