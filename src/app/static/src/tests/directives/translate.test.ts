import {createLocalVue, mount, shallowMount} from "@vue/test-utils";
import Vuex from "vuex";
import registerTranslations from "../../app/store/translations/registerTranslations";
import {Language} from "../../app/store/translations/locales";

describe("translate directive", () => {

    const TranslateAttributeTest = {
        template: '<input v-translate:value="\'validate\'" />'
    };

    const TranslateInnerTextTest = {
        template: '<h4 v-translate>validate</h4>'
    };

    const localVue = createLocalVue();

    const createStore = () => {
        const store = new Vuex.Store({
            state: {language: Language.en}
        });
        registerTranslations(store);
        return store as any;
    };

    localVue.component('translate-attribute', TranslateAttributeTest);
    localVue.component('translate-text', TranslateInnerTextTest);

    it("initialises the attribute with the translated text", () => {
        const store = createStore();
        const rendered = shallowMount(TranslateAttributeTest, {store, localVue});
        expect((rendered.find("input").element as HTMLInputElement).value).toBe("Validate");
    });

    it("translates the attribute when the store language changes", () => {
        const store = createStore();
        const rendered = shallowMount(TranslateAttributeTest, {store, localVue});
        expect((rendered.find("input").element as HTMLInputElement).value).toBe("Validate");
        store.state.language = Language.fr;
        expect((rendered.find("input").element as HTMLInputElement).value).toBe("Valider");
    });

    it("initialises inner text with translated text", () => {
        const store = createStore();
        const rendered = mount(TranslateInnerTextTest, {store, localVue});
        expect(rendered.find("h4").text()).toBe("Validate");
    });

    it("translates inner text when the store language changes", () => {
        const store = createStore();
        const rendered = shallowMount(TranslateInnerTextTest, {store, localVue});
        expect(rendered.find("h4").text()).toBe("Validate");
        store.state.language = Language.fr;
        expect(rendered.find("h4").text()).toBe("Valider");
    });

    it("unwatches on unbind", () => {
        const store = createStore();
        const renderedAttribute = shallowMount(TranslateAttributeTest, {store, localVue});
        const renderedText = shallowMount(TranslateInnerTextTest, {store, localVue});
        expect((store._watcherVM as any)._watchers.length).toBe(2);
        renderedAttribute.destroy();
        renderedText.destroy();
        expect((store._watcherVM as any)._watchers.length).toBe(0);
    });

});
