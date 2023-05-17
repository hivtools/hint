import Vue from "vue";
import {mount, shallowMount} from "@vue/test-utils";

import ADRKey from "../../../app/components/adr/ADRKey.vue";
import Vuex, {ActionTree} from "vuex";
import {Error} from "../../../app/generated";
import {mockADRState, mockError, mockRootState} from "../../mocks";
import {mutations} from "../../../app/store/adr/mutations";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {RootState} from "../../../app/root";
import ErrorAlert from "../../../app/components/ErrorAlert.vue";
import {ADRActions} from "../../../app/store/adr/actions";
import {ADRState} from "../../../app/store/adr/adr";

describe("ADR Key", function () {

    const saveStub = jest.fn();
    const deleteStub = jest.fn();

    const createStore = (key: string = "", error: Error | null = null) => {
        const store = new Vuex.Store({
            state: mockRootState(),
            modules: {
                adr: {
                    namespaced: true,
                    state: mockADRState({key: key, keyError: error, schemas: {baseUrl: "www.adr.com"} as any}),
                    mutations,
                    actions: {
                        saveKey: saveStub,
                        deleteKey: deleteStub
                    } as Partial<ADRActions> & ActionTree<ADRState, RootState>
                }
            }
        });
        registerTranslations(store);
        return store;
    };

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("shows title", () => {
        const rendered = shallowMount(ADRKey, {store: createStore()});
        expect(rendered.findComponent("label").text()).toBe("ADR access key");
    });

    it("shows asterisks if key exists", () => {
        const rendered = shallowMount(ADRKey, {store: createStore("123-abc")});
        expect(rendered.findComponent("span").text()).toBe("*******");
    });

    it("shows none message if key does not exists", () => {
        const rendered = shallowMount(ADRKey, {store: createStore()});
        expect(rendered.findComponent("span").text()).toBe("none provided");
    });

    it("shows remove button if key exists", () => {
        const rendered = shallowMount(ADRKey, {store: createStore("123-abc")});
        const links = rendered.findAllComponents(".btn")
        expect(links.length).toBe(1);
        expect(links[0].text()).toBe("Remove");
    });

    it("shows add button if key does not exist", () => {
        const rendered = shallowMount(ADRKey, {store: createStore()});
        const links = rendered.findAllComponents(".btn");
        expect(links.length).toBe(2);
        expect(links[0].text()).toBe("Add");
    });

    it("shows button to ADR with tooltip if key does not exist", () => {
        const mockTooltipDirective = jest.fn();
        const rendered = shallowMount(ADRKey, {store: createStore(), directives: {"tooltip": mockTooltipDirective}});
        const links = rendered.findAllComponents("a");
        expect(links.length).toBe(1);
        expect(links[0].text()).toBe("Get access key from ADR");
        expect(links[0].attributes("href")).toBe("www.adr.com/me");
        expect(mockTooltipDirective.mock.calls[0][0].innerHTML)
            .toBe("Get access key from ADR");
        expect(mockTooltipDirective.mock.calls[0][1].value)
            .toBe("To import data from the ADR you have to provide your ADR access key. " +
                "This can be found on your ADR profile page");
    });

    it("can add key", async () => {
        const rendered = mount(ADRKey,
            {
                store: createStore(),
                attachToDocument: true,
                stubs: ["tree-select"]
            });
        expect(rendered.findAllComponents(".input-group").length).toBe(0);
        const links = rendered.findAllComponents(".btn")
        links[0].trigger("click");

        await Vue.nextTick();
        expect(rendered.findComponent("button").text()).toBe("Save");
        expect(rendered.findComponent("input").element).toBe(document.activeElement);

        expect((rendered.findComponent("input").element as HTMLInputElement).placeholder).toBe("Enter key");
        rendered.findComponent("input").setValue("new-key-456");
        rendered.findComponent("button").trigger("click");

        await Vue.nextTick();

        expect(saveStub.mock.calls.length).toBe(1);
    });

    it("cannot save empty key", async () => {
        const rendered = shallowMount(ADRKey, {store: createStore()});
        expect(rendered.findAllComponents(".input-group").length).toBe(0);
        const links = rendered.findAllComponents(".btn")
        links[0].trigger("click");

        await Vue.nextTick();

        rendered.findComponent("input").setValue("");

        await Vue.nextTick();

        rendered.findComponent("button").trigger("click");

        await Vue.nextTick();

        expect(rendered.findComponent("button").attributes("disabled")).toBe("disabled");
        expect(saveStub.mock.calls.length).toBe(0);
    });

    it("can cancel editing", async () => {
        const rendered = shallowMount(ADRKey, {store: createStore()});
        expect(rendered.findAllComponents(".input-group").length).toBe(0);
        const links = rendered.findAllComponents(".btn")
        links[0].trigger("click");

        await Vue.nextTick();

        expect(rendered.findAllComponents(".input-group").length).toBe(1);

        const buttons = rendered.findAllComponents(".btn")
        expect(buttons[1].text()).toBe("Cancel");
        buttons[1].trigger("click");

        await Vue.nextTick();

        expect(rendered.findAllComponents(".input-group").length).toBe(0);
    });

    it("can remove key", async () => {
        const rendered = shallowMount(ADRKey, {store: createStore("123-abc")});
        expect(rendered.findAllComponents(".input-group").length).toBe(0);
        const links = rendered.findAllComponents(".btn")
        links[0].trigger("click");

        await Vue.nextTick();

        expect(deleteStub.mock.calls.length).toBe(1);
    });

    it("can add key", async () => {
        const rendered = shallowMount(ADRKey, {store: createStore()});
        expect(rendered.findAllComponents(".input-group").length).toBe(0);
        rendered.findComponent(".btn").trigger("click");

        await Vue.nextTick();

        rendered.findComponent("input").setValue("new-key-456");
        rendered.findComponent("button").trigger("click");

        await Vue.nextTick();

        expect(saveStub.mock.calls.length).toBe(1);
    });

    it("displays error if it exists", () => {
        let rendered = shallowMount(ADRKey, {store: createStore("", null)});
        expect(rendered.findAllComponents(ErrorAlert).length).toBe(0);

        const fakeError = mockError("whatevs")
        rendered = shallowMount(ADRKey, {store: createStore("", fakeError)});
        expect(rendered.findAllComponents(ErrorAlert).length).toBe(1);
        expect(rendered.findComponent(ErrorAlert).props("error")).toEqual(fakeError);
    });

});
