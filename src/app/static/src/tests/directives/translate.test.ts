import {createLocalVue, mount} from "@vue/test-utils";
import Vuex from "vuex";
import init from "../../app/store/translations/init";
import {Language} from "../../app/store/translations/locales";

describe("translate directive", () => {

    const TranslateTest = {
        template: '<input v-translate:value="\'validate\'" />'
    };

    const localVue = createLocalVue();

    const store = new Vuex.Store({
        state: {language: Language.en}
    }) as any;

    localVue.component('translate-test', TranslateTest);
    init(store);

    it("initialises the attribute with the translated text", () => {
        const rendered = mount(TranslateTest, {store, localVue});
        expect((rendered.find("input").element as HTMLInputElement).value).toBe("Validate");
        rendered.destroy();
    });

    it("translates the attribute when the store language changes", () => {
        const rendered = mount(TranslateTest, {store, localVue});
        expect((rendered.find("input").element as HTMLInputElement).value).toBe("Validate");
        store.state.language = Language.fr;
        expect((rendered.find("input").element as HTMLInputElement).value).toBe("Valider");
        rendered.destroy();
    });

    it("unwatches on unbind", () => {
        const rendered = mount(TranslateTest, {store, localVue});
        expect((store._watcherVM as any)._watchers.length).toBe(1);
        rendered.destroy();
        expect((store._watcherVM as any)._watchers.length).toBe(0);
    });

});
