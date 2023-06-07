import {flushPromises, shallowMount} from "@vue/test-utils";
import DropDown from "../../../app/components/header/DropDown.vue";
import Vuex from "vuex";
import {emptyState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import { shallowMountWithTranslate } from "../../testHelpers";

describe("Drop down", () => {
    const store = new Vuex.Store({
        state: emptyState()
    });
    registerTranslations(store);

    it("toggles dropdown on click", async () => {
        const wrapper = shallowMountWithTranslate(DropDown, store, {
            global: {
                plugins: [store]
            }, props: {text: "text"}
        });
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu"]);
        await wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu", "show"]);
        await wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu"]);
    });

    it("closes dropdown on blur", async () => {
        const wrapper = shallowMountWithTranslate(DropDown, store, {
            global: {
                plugins: [store]
            }, props: {text: "text", delay: false}
        });
        await wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu", "show"]);
        await wrapper.find(".dropdown-toggle").trigger("blur");
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu"]);
    });

    it("closes dropdown on blur after delay when 'delay' prop is true", async () => {
        const wrapper = shallowMountWithTranslate(DropDown, store, {
            global: {
                plugins: [store]
            }, props: {text: "text", delay: true}
        });
        await wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu", "show"]);
        await wrapper.find(".dropdown-toggle").trigger("blur");
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu", "show"]);

        await new Promise((r) => setTimeout(r, 1100));

        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu"]);
    });
});
