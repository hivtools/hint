import {shallowMount} from "@vue/test-utils";
import Translated from "../../app/components/Translated.vue";
import Vuex from "vuex";
import {emptyState} from "../../app/root";
import {actions} from "../../app/store/root/actions";
import {mutations} from "../../app/store/root/mutations";
import {Language} from "../../app/store/translations/locales";
import i18next from "i18next";

describe("Translated", () => {

    const createStore = () => {
        return new Vuex.Store({
            state: emptyState(),
            actions: actions,
            mutations: mutations
        });
    };

    afterEach(async () => {
        await i18next.changeLanguage(Language.en);
    });

    it("displays translated text", () => {
        const wrapper = shallowMount(Translated, {
            propsData: {
                value: "reportBug"
            },
            store: createStore()
        });

        expect(wrapper.find("span").text()).toBe("Report a bug");
    });

    it("translates text when language changes", async () => {
        const store = createStore();
        const wrapper = shallowMount(Translated, {
            propsData: {
                value: "reportBug"
            },
            store
        });

        expect(wrapper.find("span").text()).toBe("Report a bug");
        await store.dispatch("changeLanguage", Language.fr);
        expect(wrapper.find("span").text()).toBe("Envoyer un rapport de bug");
    });

});
