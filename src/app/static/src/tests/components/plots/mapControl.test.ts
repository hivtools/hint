import {createLocalVue, shallowMount} from '@vue/test-utils';
import MapControl from "../../../app/components/plots/MapControl.vue";
import TreeSelect from '@riophae/vue-treeselect'
import Vuex from "vuex";
import {mockBaselineState, mockFilteredDataState, mockShapeResponse} from "../../mocks";
import {DataType} from "../../../app/store/filteredData/filteredData";
import {actions} from "../../../app/store/filteredData/actions";
import Vue from "vue";

const localVue = createLocalVue();
Vue.use(Vuex);

describe("Map control component", () => {

    const getStore = (choroplethIndicatorsMetadata?: any, selectedDataType: DataType = DataType.Survey) => {

        if (!choroplethIndicatorsMetadata) {
            choroplethIndicatorsMetadata = {
                art_coverage: {
                    name: "ART coverage"
                },
                prevalence: {
                    name: "Prevalence"
                }
            }
        }

        return new Vuex.Store({
            modules: {
                filteredData: {
                    namespaced: true,
                    state: mockFilteredDataState({selectedDataType: selectedDataType})
                },
                metadata: {
                    namespaced: true,
                    getters: {
                        choroplethIndicatorsMetadata: () => {
                            return choroplethIndicatorsMetadata

                        }
                    }
                }
            }
        });
    };

    it("renders indicator options", () => {
        const store = getStore();
        const wrapper = shallowMount(MapControl, {store, localVue});

        expect(wrapper.findAll(TreeSelect).at(0).props("options"))
            .toStrictEqual([{id: "prev", label: "Prevalence"},
                {id: "art", label: "ART coverage"}]);
    });

    it("renders indicator options with prevalence metadata only", () => {
        const store = getStore({
            prevalence: {
                name: "Prevalence"
            }
        });
        const wrapper = shallowMount(MapControl, {store, localVue});

        expect(wrapper.findAll(TreeSelect).at(0).props("options"))
            .toStrictEqual([{id: "prev", label: "Prevalence"}]);
    });

    it("renders indicator options with ART coverage metadata only", () => {
        const store = getStore({
            art_coverage: {
                name: "ART coverage"
            }
        });
        const wrapper = shallowMount(MapControl, {store, localVue});

        expect(wrapper.findAll(TreeSelect).at(0).props("options"))
            .toStrictEqual([{id: "art", label: "ART coverage"}]);
    });

    it("renders indicator options with Current ART metadata only", () => {
        const store = getStore({
            current_art: {
                name: "Number on ART"
            }
        });
        const wrapper = shallowMount(MapControl, {store, localVue});

        expect(wrapper.findAll(TreeSelect).at(0).props("options"))
            .toStrictEqual([{id: "art", label: "Number on ART"}]);
    });

    it("does not render ART for Output data type", () => {
        const store = getStore(null, DataType.Output);
        const wrapper = shallowMount(MapControl, {store, localVue});

        expect(wrapper.findAll(TreeSelect).at(0).props("options"))
            .toStrictEqual([{id: "prev", label: "Prevalence"}]);
    });

    it("does not render ART for ANC data type", () => {
        const store = getStore(null, DataType.ANC);
        const wrapper = shallowMount(MapControl, {store, localVue});

        expect(wrapper.findAll(TreeSelect).at(0).props("options"))
            .toStrictEqual([{id: "prev", label: "Prevalence"}]);
    });

    it("renders detail options", () => {
        const store = getStore();
        const wrapper = shallowMount(MapControl, {store, localVue});

        expect(wrapper.findAll(TreeSelect).at(1).props("options"))
            .toStrictEqual([{id: 1, label: "Country"},
                {id: 2, label: "Admin level 2"},
                {id: 3, label: "Admin level 3"},
                {id: 4, label: "Admin level 4"},
                {id: 5, label: "Admin level 5"},
                {id: 6, label: "Admin level 6"}]);
    });

    it("emits indicator-changed event with indicator", () => {
        const store = getStore();
        const wrapper = shallowMount(MapControl, {store, localVue});
        wrapper.findAll(TreeSelect).at(0).vm.$emit("input", "art");
        expect(wrapper.emitted("indicator-changed")[0][0]).toBe("art");
    });

    it("emits detail-changed event with detail", () => {
        const store = getStore();
        const wrapper = shallowMount(MapControl, {store, localVue});
        wrapper.findAll(TreeSelect).at(1).vm.$emit("input", 3);
        expect(wrapper.emitted("detail-changed")[0][0]).toBe(3);
    });

});
