import {emptyState} from "../../app/root";
import Vuex from "vuex";
import Accessibility from "../../app/components/Accessibility.vue"

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

    it(`renders accessibility h1 and h2 tags as expected`, () => {
        const store = createStore();
        const rendered = shallowMount(Accessibility, {store});

        expect(rendered.find("#accessibility-content")
            .find("h1").text()).toBe("Accessibility on NAOMI")

        const h2 = rendered.find("#accessibility-content").findAll("h2")
        expect(h2.at(0).text()).toBe("How accessible the website is")
        expect(h2.at(1).text()).toBe("What we do about known issues")
        expect(h2.at(2).text()).toBe("Technical information about this website’s accessibility")
        expect(h2.at(3).text()).toBe("Reporting accessibility issues")
        expect(h2.at(4).text()).toBe("Enforcement procedure")
        expect(h2.at(5).text()).toBe("How we test this website")
        expect(h2.at(6).text()).toBe("Last updated")

        const paragraph = rendered.find("#accessibility-content").findAll("p")
        expect(paragraph.at(11).text()).toBe("This statement was prepared on 24 February 2021." +
            " It was last updated on 24 February 2021.")
    })

    it(`renders accessibility h1 and h2 tags as expected`, () => {
        const store = createStore();
        const rendered = shallowMount(Accessibility, {store});
        rendered.vm.$store.state.language = Language.fr

        expect(rendered.find("#accessibility-content")
            .find("h1").text()).toBe("Accessibilité sur NAOMI")

        const h2 = rendered.find("#accessibility-content").findAll("h2")
        expect(h2.at(0).text()).toBe("Dans quelle mesure le site Web est-il accessible")
        expect(h2.at(1).text()).toBe("Ce que nous faisons face aux problèmes connus")
        expect(h2.at(2).text()).toBe("Informations techniques sur l'accessibilité de ce site Web")
        expect(h2.at(3).text()).toBe("Signaler des problèmes d'accessibilité")
        expect(h2.at(4).text()).toBe("Procédure d'exécution")
        expect(h2.at(5).text()).toBe("Comment nous testons ce site Web")
        expect(h2.at(6).text()).toBe("Dernière mise à jour")

        const paragraph = rendered.find("#accessibility-content").findAll("p")
        expect(paragraph.at(11).text()).toBe("Cette déclaration a été préparée " +
            "le 24 février 2021. Elle a été mise à jour pour la dernière fois le 24 février 2021.")
    })
})
