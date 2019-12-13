import {mount, shallowMount} from "@vue/test-utils";
import Vuex from "vuex";
import registerTranslations from "../../app/store/translations/registerTranslations";
import {Language} from "../../app/store/translations/locales";

describe("translate directive", () => {

    beforeAll(() => {
        console.warn = jest.fn();
    });

    afterAll(() => {
        (console.warn as jest.Mock).mockClear();
    });

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

    const TranslateMultiple = {
        template: '<input v-translate:value="\'validate\'" v-translate:placeholder="\'email\'" v-translate="\'logout\'">',
    };

    const createStore = () => {
        const store = new Vuex.Store({
            state: {language: Language.en}
        });
        registerTranslations(store);
        return store as any;
    };

    it("initialises the attribute with the translated text", () => {
        const store = createStore();
        const rendered = shallowMount(TranslateAttributeTest, {store});
        expect((rendered.find("input").element as HTMLInputElement).value).toBe("Validate");
    });

    it("translates the attribute when the store language changes", () => {
        const store = createStore();
        const rendered = shallowMount(TranslateAttributeTest, {store});
        expect((rendered.find("input").element as HTMLInputElement).value).toBe("Validate");
        store.state.language = Language.fr;
        expect((rendered.find("input").element as HTMLInputElement).value).toBe("Valider");
    });

    it("initialises inner text with translated text", () => {
        const store = createStore();
        const renderedStatic = mount(TranslateInnerTextTestStatic, {store});
        expect(renderedStatic.find("h4").text()).toBe("Validate");

        const renderedDynamic = mount(TranslateInnerTextTestDynamic, {store});
        expect(renderedDynamic.find("h4").text()).toBe("Validate");
    });

    it("translates static inner text when the store language changes", () => {
        const store = createStore();
        const rendered = shallowMount(TranslateInnerTextTestStatic, {store});
        expect(rendered.find("h4").text()).toBe("Validate");
        store.state.language = Language.fr;
        expect(rendered.find("h4").text()).toBe("Valider");
    });

    it("translates dynamic inner text when the store language changes", () => {
        const store = createStore();
        const rendered = shallowMount(TranslateInnerTextTestDynamic, {store});
        expect(rendered.find("h4").text()).toBe("Validate");
        store.state.language = Language.fr;
        expect(rendered.find("h4").text()).toBe("Valider");
    });

    it("updates dynamic inner text when the key changes", () => {
        const store = createStore();
        const rendered = shallowMount(TranslateInnerTextTestDynamic, {store});
        expect(rendered.find("h4").text()).toBe("Validate");
        rendered.setData({
            text: "email"
        });
        expect(rendered.find("h4").text()).toBe("Email address");
    });

    it("can update language and key in any order", () => {
        const store = createStore();
        const rendered = shallowMount(TranslateInnerTextTestDynamic, {store});
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

    it("can support multiple directives for different attributes on the same element", () => {
        const store = createStore();
        const rendered = shallowMount(TranslateMultiple, {store});
        let input = (rendered.find("input").element as HTMLInputElement);
        expect(input.value).toBe("Validate");
        expect(input.placeholder).toBe("Email address");
        expect(input.innerText).toBe("Logout");

        store.state.language = Language.fr;

        input = (rendered.find("input").element as HTMLInputElement);
        expect(input.value).toBe("Valider");
        expect(input.placeholder).toBe("Adresse e-mail");
        expect(input.innerText).toBe("Déconnexion");
    });

    it("does nothing but warns if binding is invalid", () => {
        const InvalidBinding = {
            template: '<h4 v-translate=""></h4>'
        };
        const store = createStore();
        const rendered = shallowMount(InvalidBinding, {store});
        expect(rendered.find("h4").text()).toBe("");
        expect((console.warn as jest.Mock).mock.calls[0][0])
            .toBe("v-translate directive declared without a value");
    });

    it("unwatches on unbind", () => {
        const store = createStore();
        const renderedAttribute = shallowMount(TranslateAttributeTest, {store});
        const renderedText = shallowMount(TranslateInnerTextTestDynamic, {store});
        const renderedMultiple = shallowMount(TranslateMultiple, {store});
        expect((store._watcherVM as any)._watchers.length).toBe(5);
        renderedAttribute.destroy();
        expect((store._watcherVM as any)._watchers.length).toBe(4);
        renderedText.destroy();
        expect((store._watcherVM as any)._watchers.length).toBe(3);
        renderedMultiple.destroy();
        expect((store._watcherVM as any)._watchers.length).toBe(0);
    });

});
