import Vue, { nextTick } from "vue";
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
import { mountWithTranslate, shallowMountWithTranslate } from "../../testHelpers";

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
        const store = createStore();
        const rendered = shallowMountWithTranslate(ADRKey, store, {
            global: {
                plugins: [store]
            }
        });
        expect(rendered.find("label").text()).toBe("ADR access key");
    });

    it("shows asterisks if key exists", () => {
        const store = createStore("123-abc");
        const rendered = shallowMountWithTranslate(ADRKey, store, {
            global: {
                plugins: [store]
            }
        });
        expect(rendered.find("span").text()).toBe("*******");
    });

    it("shows none message if key does not exists", () => {
        const store = createStore()
        const rendered = shallowMountWithTranslate(ADRKey, store, {
            global: {
                plugins: [store]
            }
        });
        expect(rendered.find("span").text()).toBe("none provided");
    });

    it("shows remove button if key exists", () => {
        const store = createStore("123-abc");
        const rendered = shallowMountWithTranslate(ADRKey, store, {
            global: {
                plugins: [store]
            }
        });
        const links = rendered.findAll(".btn")
        expect(links.length).toBe(1);
        expect(links[0].text()).toBe("Remove");
    });

    it("shows add button if key does not exist", () => {
        const store = createStore()
        const rendered = shallowMountWithTranslate(ADRKey, store, {
            global: {
                plugins: [store]
            }
        });
        const links = rendered.findAll(".btn");
        expect(links.length).toBe(2);
        expect(links[0].text()).toBe("Add");
    });

    it("shows button to ADR with tooltip if key does not exist", () => {
        const mockTooltipDirective = jest.fn();
        const store = createStore()
        const rendered = shallowMountWithTranslate(ADRKey, store, {
            global: {
                plugins: [store]
            },
            directives: {"tooltip": mockTooltipDirective}
        });
        const links = rendered.findAll("a");
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
        const store = createStore()
        const rendered = mountWithTranslate(ADRKey, store,
            {
                global: {
                    plugins: [store],
                    stubs: ["tree-select"]
                },
                attachToDocument: true,
            });
        expect(rendered.findAll(".input-group").length).toBe(0);
        const links = rendered.findAll(".btn")
        await links[0].trigger("click");

        expect(rendered.find("input").element).toBe(document.activeElement);
        expect(rendered.find("button").text()).toBe("Save");

        expect((rendered.find("input").element as HTMLInputElement).placeholder).toBe("Enter key");
        rendered.find("input").setValue("new-key-456");
        await rendered.find("button").trigger("click");

        expect(saveStub.mock.calls.length).toBe(1);
    });

    it("cannot save empty key", async () => {
        const store = createStore();
        const rendered = mountWithTranslate(ADRKey, store, {
            global: {
                plugins: [store]
            }
        });
        expect(rendered.findAll(".input-group").length).toBe(0);
        const links = rendered.findAll(".btn")
        await links[0].trigger("click");

        await rendered.find("input").setValue("");

        await rendered.find("button").trigger("click");

        expect((rendered.find("button").element as HTMLButtonElement).disabled).toBe(true);
        expect(saveStub.mock.calls.length).toBe(0);
    });

    it("can cancel editing", async () => {
        const store = createStore();
        const rendered = shallowMountWithTranslate(ADRKey, store, {
            global: {
                plugins: [store]
            }
        });
        expect(rendered.findAll(".input-group").length).toBe(0);
        const links = rendered.findAll(".btn")
        await links[0].trigger("click");

        expect(rendered.findAll(".input-group").length).toBe(1);

        const buttons = rendered.findAll(".btn")
        expect(buttons[1].text()).toBe("Cancel");
        await buttons[1].trigger("click");

        expect(rendered.findAll(".input-group").length).toBe(0);
    });

    it("can remove key", async () => {
        const store = createStore("123-abc");
        const rendered = shallowMountWithTranslate(ADRKey, store, {
            global: {
                plugins: [store]
            }
        });
        expect(rendered.findAll(".input-group").length).toBe(0);
        const links = rendered.findAll(".btn")
        await links[0].trigger("click");

        expect(deleteStub.mock.calls.length).toBe(1);
    });

    it("can add key", async () => {
        const store = createStore();
        const rendered = shallowMountWithTranslate(ADRKey, store, {
            global: {
                plugins: [store]
            }
        });
        expect(rendered.findAll(".input-group").length).toBe(0);
        await rendered.find(".btn").trigger("click");

        await rendered.find("input").setValue("new-key-456");
        await rendered.find("button").trigger("click");

        expect(saveStub.mock.calls.length).toBe(1);
    });

    it("displays error if it exists", () => {
        const store = createStore("", null);
        let rendered = shallowMountWithTranslate(ADRKey, store, {
            global: {
                plugins: [store]
            }
        });
        expect(rendered.findAllComponents(ErrorAlert).length).toBe(0);

        const fakeError = mockError("whatevs")
        rendered = shallowMountWithTranslate(ADRKey, store, {
            global: {
                plugins: [createStore("", fakeError)]
            }
        });
        expect(rendered.findAllComponents(ErrorAlert).length).toBe(1);
        expect(rendered.findComponent(ErrorAlert).props("error")).toEqual(fakeError);
    });

});
