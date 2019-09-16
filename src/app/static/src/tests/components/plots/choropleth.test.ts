import {createLocalVue, shallowMount} from '@vue/test-utils';
import Choropleth from "../../../app/components/plots/Choropleth.vue";
import Vue from "vue";
import Vuex from "vuex";
import {mockAxios, mockBaselineState, mockShapeResponse} from "../../mocks";
import {LGeoJson} from 'vue2-leaflet';
import MapControl from "../../../app/components/plots/MapControl.vue";
import {interpolateCool, interpolateWarm} from "d3-scale-chromatic"

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Choropleth component", () => {

    const fakeFeatures = [
        {
            "properties": {"iso3": "MWI", "area_id": "MWI.1.1"},
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": [[[[35.7083, -15.2047], [35.7117, -15.2066], [35.7108, -15.2117]]]]
            }
        },
        {
            "properties": {"iso3": "MWI", "area_id": "MWI.1.1.1"},
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": [[[[35.7083, -15.2047], [35.7117, -15.2066], [35.7108, -15.2117]]]]
            }
        },
        {
            "properties": {"iso3": "MWI", "area_id": "MWI.1.1.2"},
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": [[[[35.7083, -15.2047], [35.7117, -15.2066], [35.7108, -15.2117]]]]
            }
        }
    ];
    const testRegionIndicators = {
        indicators: {
            "MWI.1.1.1": {prev: 0.1, art: 0.08},
            "MWI.1.1.2": {prev: 0.05, art: 0.06},
            "MWI.1.1": {prev: 0.07, art: 0.2}
        },
        artRange: {min: 0.06, max:0.2},
        prevRange: {min: 0.05, max: 0.1}
    };
    const store = new Vuex.Store({
        modules: {
            baseline: {
                namespaced: true,
                state: mockBaselineState({
                    shape: mockShapeResponse({
                        data: {features: fakeFeatures} as any
                    })
                })
            },
            filteredData: {
                namespaced: true,
                getters: {
                    regionIndicators: () => {
                        return testRegionIndicators;
                    }
                }
            }
        }
    });

    it("gets features from store and renders those with the right admin level", (done) => {
        // admin level is hard-coded to 4
        const wrapper = shallowMount(Choropleth, {store, localVue});

        setTimeout(() => {
            expect(wrapper.findAll(LGeoJson).length).toBe(2);
            done();
        })
    });

    it("calculates min and max according to indicator", () => {
        //default to prev
        const wrapper = shallowMount(Choropleth, {store, localVue});

        const vm = wrapper.vm as any;
        expect(vm.min).toBe(0.05);
        expect(vm.max).toBe(0.1);

        //update to ART
        wrapper.find(MapControl).vm.$emit("indicator-changed", "art");

        Vue.nextTick();
        expect(vm.min).toBe(0.06);
        expect(vm.max).toBe(0.2);
    });

    it("calculates indicators from filteredData", () => {
        //default to prev
        const wrapper = shallowMount(Choropleth, {store, localVue});

        const vm = wrapper.vm as any;
        expect(vm.indicatorData).toEqual(testRegionIndicators);
    });


    it("colors features according to indicator", (done) => {
        const wrapper = shallowMount(Choropleth, {store, localVue});

        setTimeout(() => {
            const expectedVal = 0.1 / (0.1 - 0.05); //prev value within the indicators range for first level 3 area
            const expectedColor = interpolateCool(expectedVal);
            expect(wrapper.findAll(LGeoJson).at(0).props("optionsStyle").fillColor).toBe(expectedColor);
            done();
        })
    });

    it("updates colors when the indicator changes", (done) => {
        const wrapper = shallowMount(Choropleth, {store, localVue});

        setTimeout(() => {
            const expectedVal = 0.08 / (0.2 - 0.06); //art value within the indicators range for first level 3 area
            const expectedColor = interpolateWarm(expectedVal);
            wrapper.find(MapControl).vm.$emit("indicator-changed", "art");
            expect(wrapper.findAll(LGeoJson).at(0).props("optionsStyle").fillColor).toBe(expectedColor);
            done();
        })
    });

    it("updates features shown when the detail control changes", (done) => {
        const wrapper = shallowMount(Choropleth, {store, localVue});

        setTimeout(() => {
            wrapper.find(MapControl).vm.$emit("detail-changed", 1);
            expect(wrapper.findAll(LGeoJson).length).toBe(0);
            done();
        })
    });

});

