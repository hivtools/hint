import {createLocalVue, mount} from "@vue/test-utils";
import Vuex from "vuex";
import init from "../../app/store/translations/init";
import {Language} from "../../app/store/translations/locales";

const store = new Vuex.Store({
    state: {language: Language.en}
});
init(store);

const localVue = createLocalVue();
const TranslateTest = {
    template: '<input v-translate:value="\'validate\'" />'
};
localVue.component('translate-test', TranslateTest);

describe("translate directive", () => {

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
        console.log(((store as any)._watcherVM as any)._watchers);
        expect(((store as any)._watcherVM as any)._watchers.length).toBe(1);
        rendered.destroy();
        expect(((store as any)._watcherVM as any)._watchers.length).toBe(0);
    });

});
