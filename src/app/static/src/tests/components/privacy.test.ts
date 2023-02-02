import {emptyState} from "../../app/root";
import Vuex from "vuex";
import Privacy from "../../app/components/Privacy.vue"

import registerTranslations from "../../app/store/translations/registerTranslations";
import {shallowMount} from "@vue/test-utils";
import {expectTranslated} from "../testHelpers";
import {actions} from "../../app/store/root/actions";
import {mutations} from "../../app/store/root/mutations";
import {Language} from "../../app/store/translations/locales";

describe(`accessibility`, () =>{
    const createStore = () => {
        const store = new Vuex.Store({
            state: emptyState(),
            actions: actions,
            mutations: mutations
        });
        registerTranslations(store);
        return store;
    };

    const getWrapper = () => {
        return shallowMount(Privacy,
            {
                store: createStore()
            })
    }

    it(`renders privacy tags as expected`, () => {
        const rendered = getWrapper()
        const store = rendered.vm.$store;
        const h1 = rendered.find("#privacy-content")
            .find("h1");

        expectTranslated(h1, "Privacy notice for naomi.unaids.org",
            "Avis de confidentialité pour naomi.unaids.org",
            "Aviso de privacidade para naomi.unaids.org", store);

        const h2 = rendered.find("#privacy-content").findAll("h2")

        expectTranslated(h2.at(0),"What do we collect?", "What do we collect?",
            "What do we collect?", store);
        expectTranslated(h2.at(1), "Information we collect from third parties", "Information we collect from third parties",
            "Information we collect from third parties", store);
        expectTranslated(h2.at(2), "How we use your personal data", "How we use your personal data",
            "How we use your personal data", store);
        expectTranslated(h2.at(3), "Where we store your data",
            "Where we store your data",
            "Where we store your data", store);
        expectTranslated(h2.at(4), "How we keep your data secure", "How we keep your data secure",
            "How we keep your data secure", store);
        expectTranslated(h2.at(5), "How long will you use my personal data for?", "How long will you use my personal data for?",
            "How long will you use my personal data for?", store);
        expectTranslated(h2.at(6), "Disclosing your information", "Disclosing your information",
            "Disclosing your information", store);
        expectTranslated(h2.at(7), "Your rights", "Your rights",
            "Your rights", store);
        expectTranslated(h2.at(8), "Links to other websites", "Links to other websites",
            "Links to other websites", store);
    })

    it(`renders privacy preamble list tags as expected`, () => {
        const rendered = getWrapper()

        const li = rendered.find("#privacy-content").find("#preamble").findAll("ul li")
        expect(li.length).toBe(3)
        expect(li.at(0).text()).toBe("inform you as to how we look after your personal data when you visit our websites;")
        expect(li.at(1).text()).toBe("tell you about your privacy rights;")
        expect(li.at(2).text()).toBe("tell you how the law protects you;")
    })

    it(`renders accessibility purpose list tags as expected in French`, () => {
        const rendered = getWrapper()
        rendered.vm.$store.state.language = Language.fr;
        const li = rendered.find("#privacy-content").find("#preamble").findAll("ul li")
        expect(li.length).toBe(3)
        expect(li.at(0).text()).toBe("inform you as to how we look after your personal data when you visit our websites;")
        expect(li.at(1).text()).toBe("tell you about your privacy rights;")
        expect(li.at(2).text()).toBe("tell you how the law protects you;")
    })
})
