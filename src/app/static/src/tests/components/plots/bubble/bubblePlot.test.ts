import {createLocalVue, shallowMount, Wrapper} from "@vue/test-utils";
import BubblePlot from "../../../../app/components/plots/bubble/BubblePlot.vue";
import {LCircleMarker, LGeoJson, LTooltip} from "vue2-leaflet";
import {getFeatureIndicators, getRadius} from "../../../../app/components/plots/bubble/utils";
import {getColor} from "../../../../app/components/plots/utils";
import MapControl from "../../../../app/components/plots/MapControl.vue";
import {NestedFilterOption} from "../../../../app/generated";
import registerTranslations from "../../../../app/store/translations/registerTranslations";
import Vuex from "vuex";
import Treeselect from '@riophae/vue-treeselect';
import {emptyState} from "../../../../app/root";
import Vue from "vue";
import MapLegend from "../../../../app/components/plots/MapLegend.vue";
import SizeLegend from "../../../../app/components/plots/bubble/SizeLegend.vue";
import {expectFilter, plhiv, prev, testData} from "../testHelpers"
import {ScaleType} from "../../../../app/store/plottingSelections/plottingSelections";

const localVue = createLocalVue();
const store = new Vuex.Store({
    state: emptyState()
});
registerTranslations(store);

const propsData = {
    ...testData,
    selections: {
        colorIndicatorId: "prevalence",
        sizeIndicatorId: "plhiv",
        detail: 4,
        selectedFilterOptions: {
            age: [{id: "0:15", label: "0-15"}],
            sex: [{id: "female", label: "Female"}],
            area: []
        }
    },
    colourScales: {
        prevalence: {
            type: ScaleType.Default,
            customMin: 0,
            customMax: 1
        }
    }
};

const allAreaIds = ["MWI", "MWI_3_1", "MWI_3_2", "MWI_4_1", "MWI_4_2"];

const getWrapper = (customPropsData: any = {}) => {

    return shallowMount(BubblePlot, {propsData: {...propsData, ...customPropsData}, localVue});
};

export const expectIndicatorSelect = (wrapper: Wrapper<Vue>, divId: string, value: string) => {
    const indDiv = wrapper.find("#" + divId);
    expect(indDiv.classes()[0]).toBe("form-group");
    const indSelect = indDiv.find(Treeselect);
    expect(indSelect.props().multiple).toBe(false);
    expect(indSelect.props().clearable).toBe(false);
    expect(indSelect.props().options).toStrictEqual(propsData.indicators);
    expect(indSelect.props().value).toBe(value);
};

describe("BubblePlot component", () => {
    it("renders plot as expected", () => {
        const wrapper = getWrapper();
        const geoJsons = wrapper.findAll(LGeoJson);
        expect(geoJsons.length).toBe(2);
        expect(geoJsons.at(0).props().geojson).toBe(propsData.features[2]);
        expect(geoJsons.at(1).props().geojson).toBe(propsData.features[3]);

        //These are hardcoded in the component
        const minRadius = 10;
        const maxRadius = 60;

        const circles = wrapper.findAll(LCircleMarker);
        expect(circles.length).toBe(2);
        expect(circles.at(0).props().latLng).toEqual([-15.2047, 35.7083]);
        expect(circles.at(0).props().radius).toEqual(getRadius(10, 1, 20, 10, 70));
        expect(circles.at(0).find(LTooltip).props().content).toEqual(`<div>
                            <strong>North West</strong>
                            <br/>Prevalence: 10.00%
                            <br/>PLHIV: 100
                        </div>`);
        const meta = propsData.indicators[1];
        const colourRange = {min: meta.min, max: meta.max};
        let color = getColor(0.1, meta, colourRange);
        expect(circles.at(0).props().color).toEqual(color);
        expect(circles.at(0).props().fillColor).toEqual(color);

        expect(circles.at(1).props().latLng).toEqual([-15.2048, 35.7084]);
        expect(circles.at(1).props().radius).toEqual(getRadius(20, 1, 20, 10, 70));
        expect(circles.at(1).find(LTooltip).props().content).toEqual(`<div>
                            <strong>North East</strong>
                            <br/>Prevalence: 20.00%
                            <br/>PLHIV: 200
                        </div>`);
        color = getColor(0.2, meta, colourRange);
        expect(circles.at(1).props().color).toEqual(color);
        expect(circles.at(1).props().fillColor).toEqual(color);

        expect(wrapper.find(MapControl).props().initialDetail).toEqual(4);
        expect(wrapper.find(MapControl).props().showIndicators).toEqual(false);
    });

    it("renders area filter", () => {
        const wrapper = getWrapper();
        expectFilter(wrapper, "area-filter", [], "Area", true, [
            {id: "MWI_3_1", label: "3.1"},
            {id: "MWI_3_2", label: "3.2"},
            {id: "MWI_4_1", label: "4.1"},
            {id: "MWI_4_2", label: "4.2"}]);
    });

    it("renders non-area filters", () => {
        const wrapper = getWrapper();

        expectFilter(wrapper, "filter-age", ["0:15"], "Age", false,
            [{id: "0:15", label: "0-15"}, {id: "15:30", label: "15-30"}]);
        expectFilter(wrapper, "filter-sex", ["female"], "Sex", false,
            [{id: "female", label: "Female"}, {id: "male", label: "Male"}]);
    });

    it("renders indicators", () => {
        const wrapper = getWrapper();
        expectIndicatorSelect(wrapper, "color-indicator", "prevalence");
        expectIndicatorSelect(wrapper, "size-indicator", "plhiv");
    });

    it("renders color legend", () => {
        const wrapper = getWrapper();
        const legend = wrapper.find(MapLegend);
        expect(legend.props().metadata).toBe(propsData.indicators[1]);
        expect(legend.props().colourScale).toBe(propsData.colourScales.prevalence);
        expect(legend.props().colourRange).toStrictEqual({min: 0, max: 0.8});
    });

    it("renders size legend", () => {
        const wrapper = getWrapper();
        const sizeLegend = wrapper.find(SizeLegend);
        expect(sizeLegend.props().indicatorRange).toStrictEqual({min: 1, max: 20});
        expect(sizeLegend.props().minRadius).toBe(10);
        expect(sizeLegend.props().maxRadius).toBe(70);
    });

    it("computes sizeRange", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;

        expect(vm.sizeRange).toStrictEqual({
            min: 1,
            max: 20
        });
    });

    it("computes colourRange", async () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        expect(vm.colourRange).toStrictEqual({
            min: 0,
            max: 0.8
        });

        wrapper.setProps({
            colourScales: {
                prevalence: {
                    type: ScaleType.Custom,
                    customMin: 1,
                    customMax: 2
                }
            }
        });

        await Vue.nextTick();
        expect(vm.colourRange).toStrictEqual({
            min: 1,
            max: 2
        });

        wrapper.setProps({
            colourScales: {
                prevalence: {
                    type: ScaleType.DynamicFull,
                    customMin: 1,
                    customMax: 2
                }
            }
        });

        await Vue.nextTick();
        expect(vm.colourRange).toStrictEqual({
            min: 0,
            max: 0.9
        });

        wrapper.setProps({
            colourScales: {
                prevalence: {
                    type: ScaleType.DynamicFiltered,
                    customMin: 1,
                    customMax: 2
                }
            },
            selections: {
                colorIndicatorId: "prevalence",
                sizeIndicatorId: "plhiv",
                detail: 4,
                selectedFilterOptions: {
                    age: [{id: "0:15", label: "0-15"}],
                    sex: [{id: "male", label: "Male"}],
                    area: []
                }
            }
        });

        await Vue.nextTick();
        expect(vm.colourRange).toStrictEqual({
            min: 0.1,
            max: 0.9
        });

    });


    it("computes currentLevelFeatureIds", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        expect(vm.currentLevelFeatureIds).toStrictEqual(["MWI_4_1", "MWI_4_2"]);
    });

    it("computes featureIndicators", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;

        const sizeRange = {
            min: 1,
            max: 20
        };
        const colorRange = {
            min: 0,
            max: 0.8
        };
        expect(vm.featureIndicators).toStrictEqual(getFeatureIndicators(propsData.chartdata,
            allAreaIds,
            plhiv,
            prev,
            sizeRange,
            colorRange,
            [propsData.filters[1], propsData.filters[2]],
            propsData.selections.selectedFilterOptions,
            10,
            70));
    });

    it("computes featuresByLevel", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;

        expect(vm.featuresByLevel).toStrictEqual({
            0: [propsData.features[0]],
            3: [propsData.features[1], propsData.features[4]],
            4: [propsData.features[2], propsData.features[3]]
        });
    });

    it("computes maxLevel", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        expect(vm.maxLevel).toBe(4);
    });

    it("computes currentFeatures", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;

        expect(vm.currentFeatures).toStrictEqual([propsData.features[2], propsData.features[3]]);
    });

    it("computes indicatorNameLookup", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        expect(vm.indicatorNameLookup).toStrictEqual({
            plhiv: "PLHIV",
            prevalence: "Prevalence"
        });
    });

    it("computed flattenedAreas", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        expect(vm.flattenedAreas).toStrictEqual({
            "MWI": {
                id: "MWI", label: "Malawi", children: [
                    {id: "MWI_3_1", label: "3.1"},
                    {id: "MWI_3_2", label: "3.2"},
                    {id: "MWI_4_1", label: "4.1"},
                    {id: "MWI_4_2", label: "4.2"}
                ]
            },
            "MWI_3_1": {id: "MWI_3_1", label: "3.1"},
            "MWI_3_2": {id: "MWI_3_2", label: "3.2"},
            "MWI_4_1": {id: "MWI_4_1", label: "4.1"},
            "MWI_4_2": {id: "MWI_4_2", label: "4.2"},
        });
    });

    it("computes initialised", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        expect(vm.initialised).toBe(true);

        const uninitialisableWrapper = getWrapper({
            selections: {
                detail: -1,
                selectedFilterOptions: {}
            },
            filters: [
                propsData.filters[0], //area
                {id: "age", label: "Age", column_id: "age", options: []},
                {id: "sex", label: "Sex", column_id: "sex", options: []}
            ],
        });

        expect((uninitialisableWrapper.vm as any).initialised).toBe(false);
    });

    it("computes areaFilter", () => {
        const wrapper = getWrapper();
        expect((wrapper.vm as any).areaFilter).toBe(propsData.filters[0]);
    });

    it("computes nonAreaFilters", () => {
        const wrapper = getWrapper();
        expect((wrapper.vm as any).nonAreaFilters).toStrictEqual([propsData.filters[1], propsData.filters[2]]);
    });

    it("computes areaFilterOptions", () => {
        const wrapper = getWrapper();
        expect((wrapper.vm as any).areaFilterOptions).toBe((propsData.filters[0].options[0] as NestedFilterOption).children);
    });

    it("computes selectedAreaFilterOptions", () => {
        const wrapper = getWrapper({
            selections: {
                ...propsData.selections,
                selectedFilterOptions: {
                    ...propsData.selections.selectedFilterOptions,
                    area: [{id: "MWI_4_2", label: "4.2"}]
                }
            }
        });

        expect((wrapper.vm as any).selectedAreaFilterOptions).toStrictEqual([{id: "MWI_4_2", label: "4.2"}]);
    });

    it("computes selectedAreaFeatures where a feature is selected", () => {
        const wrapper = getWrapper({
            selections: {
                ...propsData.selections,
                selectedFilterOptions: {
                    ...propsData.selections.selectedFilterOptions,
                    area: [{id: "MWI_4_2", label: "4.2"}]
                }
            }
        });

        expect((wrapper.vm as any).selectedAreaFeatures).toStrictEqual([propsData.features[3]]);
    });

    it("computes selectedAreaFeatures where no feature is selected", () => {
        //defaults to country level
        const wrapper = getWrapper();
        expect((wrapper.vm as any).selectedAreaFeatures).toStrictEqual([propsData.features[0]]);
    });

    it("computes empty selectedAreaFeatures with empty area options", () => {
        const wrapper = getWrapper({
            filters: [{
                id: "area",
                label: "Area",
                column_id: "area_id",
                options: []
            }, propsData.filters[1], propsData.filters[2]]
        });
        expect((wrapper.vm as any).selectedAreaFeatures).toStrictEqual([]);
    });

    it("computes countryFilterOption", () => {
        const wrapper = getWrapper();
        expect((wrapper.vm as any).countryFilterOption).toBe(propsData.filters[0].options[0]);
    });

    it("computes countryFeature", () => {
        const wrapper = getWrapper();
        expect((wrapper.vm as any).countryFeature).toBe(propsData.features[0]);
    });

    it("computes colorIndicator", () => {
        const wrapper = getWrapper();
        expect((wrapper.vm as any).colorIndicator).toBe(propsData.indicators[1]);
    });

    it("computes colouIndicatorScale", () => {
        const wrapper = getWrapper();
        expect((wrapper.vm as any).colourIndicatorScale).toStrictEqual(propsData.colourScales.prevalence);
    });

    it("updateBounds updates bounds of map from features geojson", () => {
        const wrapper = getWrapper();
        const mockMapFitBounds = jest.fn();

        const vm = wrapper.vm as any;
        vm.$refs.map = {
            fitBounds: mockMapFitBounds
        };

        vm.updateBounds();
        expect(mockMapFitBounds.mock.calls[0][0]).toStrictEqual(
            [{_northEast: {lat: -15.1, lng: 35.9}, _southWest: {lat: -15.3, lng: 35.7}}]);
    });

    it("showBubble returns true for included features only", () => {
        const wrapper = getWrapper({
            selections: {
                ...propsData.selections,
                selectedFilterOptions: {
                    ...propsData.selections.selectedFilterOptions,
                    area: [{id: "MWI_4_2", label: "4.2"}]
                }
            }
        });

        const vm = wrapper.vm as any;
        expect(vm.showBubble(propsData.features[3])).toBe(true);
        expect(vm.showBubble(propsData.features[2])).toBe(false);
    });

    it("showBubble returns true only if featureIndicators include both color and size indicator values", () => {
        let wrapper = getWrapper();
        let vm = wrapper.vm as any;
        expect(vm.showBubble(propsData.features[2])).toBe(true);
        expect(vm.showBubble(propsData.features[3])).toBe(true);

        wrapper = getWrapper({
            chartdata: [
                {
                    area_id: "MWI_4_1", prevalence: 0.1, age: "0:15", sex: "female"
                },
                {
                    area_id: "MWI_4_2", plhiv: 20, age: "0:15", sex: "female"
                },
            ]
        });
        vm = wrapper.vm as any;

        expect(vm.showBubble(propsData.features[2])).toBe(false);
        expect(vm.showBubble(propsData.features[3])).toBe(false);
    });

    it("can getSelectedFilterValues", () => {
        const wrapper = getWrapper();
        expect((wrapper.vm as any).getSelectedFilterValues("age")).toStrictEqual(["0:15"]);
    });

    it("initialises from empty selections and emits updates", () => {
        const wrapper = getWrapper({
            selections: {
                detail: -1,
                selectedFilterOptions: {}
            }
        });

        expect(wrapper.emitted("update")[0][0]).toStrictEqual({detail: 4});
        expect(wrapper.emitted("update")[1][0]).toStrictEqual({colorIndicatorId: "prevalence"});
        expect(wrapper.emitted("update")[2][0]).toStrictEqual({sizeIndicatorId: "plhiv"});
        expect(wrapper.emitted("update")[3][0]).toStrictEqual({
            selectedFilterOptions: {
                age: [{id: "0:15", label: "0-15"}],
                sex: [{id: "female", label: "Female"}]
            }
        });
    });

    it("onFilterSelect updates filter value", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        vm.onFilterSelect(propsData.filters[1], [{id: "15:30", label: "15-30"}]);
        const updates = wrapper.emitted("update");
        expect(updates[updates.length - 1][0]).toStrictEqual({
            selectedFilterOptions: {
                ...propsData.selections.selectedFilterOptions,
                age: [{id: "15:30", label: "15-30"}],
            }
        });
    });

    it("onColorIndicatorSelect updates color indicator", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        vm.onColorIndicatorSelect("newIndicator");
        const updates = wrapper.emitted("update");
        expect(updates[updates.length - 1][0]).toStrictEqual({
            colorIndicatorId: "newIndicator"
        });
    });

    it("onSizeIndicatorSelect updates color indicator", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        vm.onSizeIndicatorSelect("newIndicator");
        const updates = wrapper.emitted("update");
        expect(updates[updates.length - 1][0]).toStrictEqual({
            sizeIndicatorId: "newIndicator"
        });
    });

    it("updates detail", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        vm.onDetailChange(3);

        expect(wrapper.emitted("update")[0][0].detail).toStrictEqual(3);
    });

    it("updates bounds when becomes initialised", () => {
        const mockUpdateBounds = jest.fn();
        const wrapper = getWrapper({ //this cannot initialise
            features: [...propsData.features],
            featureLevels: [...propsData.featureLevels],
            chartdata: [...propsData.chartdata],
            indicators: [...propsData.indicators],
            selections: {
                detail: -1,
                selectedFilterOptions: {}
            },
            filters: [
                propsData.filters[0], //area
                {id: "age", label: "Age", column_id: "age", options: []},
                {id: "sex", label: "Sex", column_id: "sex", options: []}
            ],
            colourScales: {...propsData.colourScales}
        });
        const vm = wrapper.vm as any;
        vm.updateBounds = mockUpdateBounds;

        wrapper.setProps(propsData); //This should initialise and trigger the watcher
        expect(mockUpdateBounds.mock.calls.length).toBeGreaterThan(0);
    });

    it("normalizeIndicators converts indicator metadata for treeselect", () => {
        const wrapper = getWrapper();
        const vm = wrapper.vm as any;
        const result = vm.normalizeIndicators(propsData.indicators[0]);
        expect(result).toStrictEqual({id: "plhiv", label: "PLHIV"});
    });

    it("emits event when colour scale updated", () => {
        const wrapper = getWrapper();
        const legend = wrapper.find(MapLegend);
        const newColourScale = {type: ScaleType.DynamicFiltered, customMin: -5, customMax: 5};
        legend.vm.$emit("update", newColourScale);

        expect(wrapper.emitted("update-colour-scales").length).toBe(1);
        expect(wrapper.emitted("update-colour-scales")[0][0]).toStrictEqual({prevalence: newColourScale});
    });
});
