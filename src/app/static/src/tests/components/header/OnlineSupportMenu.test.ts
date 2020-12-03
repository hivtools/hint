import {shallowMount} from "@vue/test-utils";
import Vuex from "vuex";
import OnlineSupportMenu from "../../../app/components/header/OnlineSupportMenu.vue";
import {emptyState} from "../../../app/root";
import {actions} from "../../../app/store/root/actions";
import {mutations} from "../../../app/store/root/mutations";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {switches} from "../../../app/featureSwitches";
import DropDown from "../../../app/components/header/DropDown.vue";

describe("Online support menu", () => {

    const createStore = () => {
        const store = new Vuex.Store({
            state: emptyState(),
            actions: actions,
            mutations: mutations
        });
        registerTranslations(store);
        return store;
    };

    it("renders menu-items text", async () => {
        const store = createStore();
        const wrapper = shallowMount(OnlineSupportMenu, {
            store
        });
        expect(wrapper.find(DropDown).props("text")).toBe("support");
    });

    it("renders menu-items text", async () => {
        const store = createStore();
        const wrapper = shallowMount(OnlineSupportMenu, {
            store, propsData: {troubleFilename: "index-en.html"}
        });

        expect(wrapper.find("a[href='https://mrc-ide.github.io/naomi-troubleshooting/index-en.html']")
            .text()).toBe("FAQ");

        expect(wrapper.find("a[href='https://forms.office.com/Pages/ResponsePage.aspx?" +
            "id=B3WJK4zudUWDC0-CZ8PTB1APqcgcYz5DmSeKo5rlcfxUN0dWR1VMUEtHU0xDRU9HWFRNOFA5VVc3WCQlQCN0PWcu']")
            .text()).toBe("Contact");
    });

    it("renders old url path when switch is off", async () => {
        const store = createStore();
        const wrapper = shallowMount(OnlineSupportMenu, {
            store, propsData: {troubleFilename: "index-en.html"}
        });

        if(!switches.modelBugReport){
            expect(wrapper.find("a[href='https://forms.gle/QxCT1b4ScLqKPg6a7")
                .text()).toBe("Contact");
        }
    });

})
