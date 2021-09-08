import {createLocalVue, shallowMount} from "@vue/test-utils";
import MapEmptyFeature from "../../../app/components/plots/MapEmptyFeature.vue";
import {emptyState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {expectTranslated} from "../../testHelpers";
import Vuex from "vuex";
import {LControl} from "vue2-leaflet";

const localVue = createLocalVue();
const store = new Vuex.Store({
    state: emptyState()
});
registerTranslations(store);

const getWrapper = () => {
    return shallowMount(MapEmptyFeature, localVue);
};

describe("MapEmptyFeature component", () => {

    it("render can display message in the middle of the map", () => {
        const wrapper = getWrapper();
        expect(wrapper.findAll(LControl).length).toBe(1)
        expect(wrapper.find(LControl).classes("empty-feature-center")).toBe(true)
        expect(wrapper.find("div").classes("empty-feature-size")).toBe(true)
    });

    it("render can display translated message on map", () => {
        const wrapper = getWrapper();
        expect(wrapper.findAll(LControl).length).toBe(1)
        const noMapData = wrapper.find(LControl).find("span")
        expectTranslated(noMapData, "No data are available for the selected combination. Please review the combination of filter values selected.",
            "Aucune donnée n'est disponible pour la combinaison sélectionnée. Veuillez examiner la combinaison de valeurs de filtre sélectionnée.",
            "Não existem dados disponíveis para a combinação selecionada. Por favor, reveja a combinação dos valores de filtro selecionados.", store as any)
    });

});
