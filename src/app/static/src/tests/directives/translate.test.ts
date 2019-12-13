import {createLocalVue, mount, shallowMount} from "@vue/test-utils";
import Vuex from "vuex";
import registerTranslations from "../../app/store/translations/registerTranslations";
import {Language} from "../../app/store/translations/locales";

describe("translate directive", () => {

    const TranslateAttributeTest = {
        template: '<input v-translate:value="\'validate\'" />'
    };

    const TranslateInnerTextTestStatic = {
        template: '<h4 v-translate="\'validate\'"></h4>'
    };

    const TranslateInnerTextTestDynamic = {
        template: '<h4 v-translate="text"></h4>',
        data() {
            return {
                text: "validate"
            }
        }
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
    localVue.component('translate-text', TranslateInnerTextTestDynamic);

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
        const renderedStatic = mount(TranslateInnerTextTestStatic, {store, localVue});
        expect(renderedStatic.find("h4").text()).toBe("Validate");

        const renderedDynamic = mount(TranslateInnerTextTestDynamic, {store, localVue});
        expect(renderedDynamic.find("h4").text()).toBe("Validate");
    });

    it("translates static inner text when the store language changes", () => {
        const store = createStore();
        const rendered = shallowMount(TranslateInnerTextTestStatic, {store, localVue});
        expect(rendered.find("h4").text()).toBe("Validate");
        store.state.language = Language.fr;
        expect(rendered.find("h4").text()).toBe("Valider");
    });

    it("translates dynamic inner text when the store language changes", () => {
        const store = createStore();
        const rendered = shallowMount(TranslateInnerTextTestDynamic, {store, localVue});
        expect(rendered.find("h4").text()).toBe("Validate");
        store.state.language = Language.fr;
        expect(rendered.find("h4").text()).toBe("Valider");
    });

    it("updates dynamic inner text when the key changes", () => {
        const store = createStore();
        const rendered = shallowMount(TranslateInnerTextTestDynamic, {store, localVue});
        expect(rendered.find("h4").text()).toBe("Validate");
        rendered.setData({
            text: "email"
        });
        expect(rendered.find("h4").text()).toBe("Email address");
    });

    it("can update language and key in any order", () => {
        const store = createStore();
        const rendered = shallowMount(TranslateInnerTextTestDynamic, {store, localVue});
        expect(rendered.find("h4").text()).toBe("Validate");
        store.state.language = Language.fr;
        expect(rendered.find("h4").text()).toBe("Valider");
        rendered.setData({
            text: "email"
        });
        expect(rendered.find("h4").text()).toBe("Adresse e-mail");
        store.state.language = Language.en;
        expect(rendered.find("h4").text()).toBe("Email address");
    });

    it("unwatches on unbind", () => {
        const store = createStore();
        const renderedAttribute = shallowMount(TranslateAttributeTest, {store, localVue});
        const renderedText = shallowMount(TranslateInnerTextTestDynamic, {store, localVue});
        expect((store._watcherVM as any)._watchers.length).toBe(2);
        renderedAttribute.destroy();
        renderedText.destroy();
        expect((store._watcherVM as any)._watchers.length).toBe(0);
    });

});
