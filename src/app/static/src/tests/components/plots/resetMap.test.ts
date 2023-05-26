import ResetMap from "../../../app/components/plots/ResetMap.vue";
import {emptyState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {expectTranslated, shallowMountWithTranslate} from "../../testHelpers";
import Vuex from "vuex";
import {LControl} from "@vue-leaflet/vue-leaflet";

const store = new Vuex.Store({
    state: emptyState()
});
registerTranslations(store);

const getWrapper = () => {
    return shallowMountWithTranslate(ResetMap, store, {global: {plugins: [store]}});
};

describe("ResetMap component", () => {

    it("render can display button on map and emit reset view when button clicked", async () => {
        const wrapper = getWrapper();
        expect(wrapper.findAllComponents(LControl).length).toBe(1)
        const button = wrapper.findComponent(LControl).find('div').find('a')
        await expectTranslated(button, 'Reset view', 'Réinitialiser la vue',
            "Repor vista", store, "aria-label");
        await expectTranslated(button, 'Reset view', 'Réinitialiser la vue',
            "Repor vista", store, "title");
        
        await button.trigger("click")
        expect(wrapper.emitted("reset-view")!).toBeTruthy();
    });

});
