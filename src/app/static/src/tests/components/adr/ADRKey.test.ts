import Vue from "vue";
import {shallowMount} from "@vue/test-utils";

import ADRKey from "../../../app/components/adr/ADRKey.vue";
import Vuex, {ActionTree} from "vuex";
import {mockRootState} from "../../mocks";
import {mutations, RootMutation} from "../../../app/store/root/mutations";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {RootActions} from "../../../app/store/root/actions";
import {RootState} from "../../../app/root";

declare let currentUser: string;

describe("ADR Key", function () {

    const fetchStub = jest.fn();
    const saveStub = jest.fn();
    const deleteStub = jest.fn();

    const createStore = (key: string = "") => {
       const store = new Vuex.Store({
           state: mockRootState({adrKey: key}),
           mutations: mutations,
           actions: {
               fetchADRKey: fetchStub,
               saveADRKey: saveStub,
               deleteADRKey: deleteStub
           } as Partial<RootActions> & ActionTree<RootState, RootState>
        });
       registerTranslations(store);
       return store;
    }

    beforeEach(() => {
        currentUser = "some.user@example.com"
        jest.resetAllMocks();
    })

    it("does not render if not logged in", () => {
        currentUser = "guest";
        const rendered = shallowMount(ADRKey, {store: createStore()});
        expect(rendered.findAll("div").length).toBe(0);
    });

    it("fetches ADR key if logged in", () => {
        shallowMount(ADRKey, {store: createStore()});
        expect(fetchStub.mock.calls.length).toBe(1);
    });

    it("does not fetch ADR key if not logged in", () => {
        currentUser = "guest";
        shallowMount(ADRKey, {store: createStore()});
        expect(fetchStub.mock.calls.length).toBe(0);
    });

    it("shows title", () => {
        const rendered = shallowMount(ADRKey, {store: createStore()});
        expect(rendered.find("label").text()).toBe("ADR API Key");
    });

    it("shows asterisks if key exists", () => {
        const rendered = shallowMount(ADRKey, {store: createStore("123-abc")});
        expect(rendered.find("span").text()).toBe("*******");
    });

    it("shows none message if key does not exists", () => {
        const rendered = shallowMount(ADRKey, {store: createStore()});
        expect(rendered.find("span").text()).toBe("none provided");
    });

    it("shows edit/remove links if key exists", () => {
        const rendered = shallowMount(ADRKey, {store: createStore("123-abc")});
        const links = rendered.findAll("a")
        expect(links.length).toBe(2);
        expect(links.at(0).text()).toBe("edit");
        expect(links.at(1).text()).toBe("remove");
    });

    it("shows add link if key does not exists", () => {
        const rendered = shallowMount(ADRKey, {store: createStore()});
        const links = rendered.findAll("a");
        expect(links.length).toBe(1);
        expect(links.at(0).text()).toBe("add");
    });

    it("can edit key", async () => {
        const rendered = shallowMount(ADRKey, {store: createStore("123-abc")});
        expect(rendered.findAll(".input-group").length).toBe(0);
        const links = rendered.findAll("a")
        links.at(0).trigger("click");

        await Vue.nextTick();

        expect(rendered.find("button").text()).toBe("Save");

        rendered.find("input").setValue("new-key-456");
        rendered.find("button").trigger("click");

        await Vue.nextTick();

        expect(saveStub.mock.calls.length).toBe(1);
    });

    it("cannot save empty key", async () => {
        const rendered = shallowMount(ADRKey, {store: createStore("123-abc")});
        expect(rendered.findAll(".input-group").length).toBe(0);
        const links = rendered.findAll("a")
        links.at(0).trigger("click");

        await Vue.nextTick();

        rendered.find("input").setValue("");

        await Vue.nextTick();

        rendered.find("button").trigger("click");

        await Vue.nextTick();

        expect(rendered.find("button").attributes("disabled")).toBe("disabled");
        expect(saveStub.mock.calls.length).toBe(0);
    });

    it("can cancel editing", async () => {
        const rendered = shallowMount(ADRKey, {store: createStore("123-abc")});
        expect(rendered.findAll(".input-group").length).toBe(0);
        const links = rendered.findAll("a")
        links.at(0).trigger("click");

        await Vue.nextTick();

        expect(rendered.findAll(".input-group").length).toBe(1);

        expect(rendered.find("a").text()).toBe("cancel");
        rendered.find("a").trigger("click");

        await Vue.nextTick();

        expect(rendered.findAll(".input-group").length).toBe(0);
    });

    it("can remove key", async () => {
        const rendered = shallowMount(ADRKey, {store: createStore("123-abc")});
        expect(rendered.findAll(".input-group").length).toBe(0);
        const links = rendered.findAll("a")
        links.at(1).trigger("click");

        await Vue.nextTick();

        expect(deleteStub.mock.calls.length).toBe(1);
    });

    it("can add key", async () => {
        const rendered = shallowMount(ADRKey, {store: createStore()});
        expect(rendered.findAll(".input-group").length).toBe(0);
        rendered.find("a").trigger("click");

        await Vue.nextTick();

        rendered.find("input").setValue("new-key-456");
        rendered.find("button").trigger("click");

        await Vue.nextTick();

        expect(saveStub.mock.calls.length).toBe(1);
    });

});
