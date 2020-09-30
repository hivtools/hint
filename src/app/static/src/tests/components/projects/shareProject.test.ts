import Vue from "vue"
import {mount, shallowMount} from "@vue/test-utils";
import ShareProject from "../../../app/components/projects/ShareProject.vue";
import Modal from "../../../app/components/Modal.vue";
import Vuex from "vuex";
import {emptyState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";
import {expectTranslated} from "../../testHelpers";

describe("ShareProject", () => {

    const createStore = (userExists = jest.fn()) => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                projects: {
                    namespaced: true,
                    actions: {
                        userExists: userExists
                    }
                }
            }
        });
        registerTranslations(store);
        return store;
    }

    it("opens modal on click", () => {
        const wrapper = shallowMount(ShareProject, {
            propsData: {
                project: {id: 1, name: "p1"}
            },
            store: createStore()
        });

        expect(wrapper.find(Modal).props("open")).toBe(false);
        const link = wrapper.find("a");
        expect(link.text()).toBe("Share");
        link.trigger("click");
        expect(wrapper.find(Modal).props("open")).toBe(true);
    });

    it("can cancel sharing", () => {
        const wrapper = mount(ShareProject, {
            propsData: {
                project: {id: 1, name: "p1"}
            },
            store: createStore()
        });

        const link = wrapper.find("a");
        link.trigger("click");
        expect(wrapper.find(Modal).props("open")).toBe(true);
        wrapper.find(Modal).findAll("button").at(1).trigger("click");
        expect(wrapper.find(Modal).props("open")).toBe(false);
    });

    it("if email is invalid, validation feedback is shown and button disabled", async () => {
        const wrapper = mount(ShareProject, {
            propsData: {
                project: {id: 1, name: "p1"}
            },
            store: createStore(jest.fn().mockResolvedValue(false)),
        });

        const link = wrapper.find("a");
        link.trigger("click");
        const input = wrapper.find(Modal).find("input");
        input.setValue("bademail");
        input.trigger("blur");
        await Vue.nextTick();
        expect(wrapper.find(Modal).find("input").classes()).toContain("is-invalid");
        expect(wrapper.find(Modal).find(".text-danger").classes()).not.toContain("d-none");
        expect(wrapper.find(Modal).find("button").attributes("disabled")).toBe("disabled");
    });

    it("if email is valid, validation feedback is not shown and button enabled", async () => {
        const wrapper = mount(ShareProject, {
            propsData: {
                project: {id: 1, name: "p1"}
            },
            store: createStore(jest.fn().mockResolvedValue(true)),
        });

        const link = wrapper.find("a");
        link.trigger("click");
        const input = wrapper.find(Modal).find("input");
        input.setValue("goodemail");
        input.trigger("blur");
        await Vue.nextTick();
        expect(wrapper.find(Modal).find("input").classes()).not.toContain("is-invalid");
        expect(wrapper.find(Modal).find(".text-danger").classes()).toContain("d-none");
        expect(wrapper.find(Modal).find("button").attributes("disabled")).toBeUndefined();
    });


    // it("if emails are valid, project is shared", (done) => {
    //     const wrapper = mount(ShareProject, {
    //         propsData: {
    //             project: {id: 1, name: "p1"}
    //         },
    //         store: createStore()
    //     });
    //
    //     const link = wrapper.find("a");
    //     link.trigger("click");
    //     wrapper.find(Modal).find("input").setValue("goodemail@gmail.com");
    //     wrapper.find(Modal).findAll("button").at(0).trigger("click");
    //     expect(wrapper.find(Modal).props("open")).toBe(true);
    //     expect(wrapper.find(Modal).findAll(LoadingSpinner).length).toBe(1);
    //
    //     setTimeout(() => {
    //         expect(wrapper.find(Modal).props("open")).toBe(false);
    //         expect(wrapper.find(Modal).findAll(LoadingSpinner).length).toBe(0);
    //         done();
    //     }, 200)
    // });

    it("translates header", () => {
        const store = createStore();
        const wrapper = shallowMount(ShareProject, {
            propsData: {
                project: {id: 1, name: "p1"}
            },
            store: store
        });

        const link = wrapper.find("a");
        link.trigger("click");
        expectTranslated(wrapper.find(Modal).find("h4"), "Share project", "Partagez projet", store);
    });

    it("translates instructions", () => {
        const store = createStore();
        const wrapper = shallowMount(ShareProject, {
            propsData: {
                project: {id: 1, name: "p1"}
            },
            store: store
        });

        const link = wrapper.find("a");
        link.trigger("click");
        const expectedEnglish  = "This will create a copy of p1 for the given users." +
        "Please enter the email addresses you would like to share " +
        "this project with. These email addresses must be already registered with Naomi."

        const expectedFrench = "Cela créera une copie de p1 pour les utilisateurs désignés." +
            "Veuillez entrer les adresses e-mails " +
            "avec lesquelles vous souhaitez partager ce projet. Ces adresses e-mails doivent être déjà enregistrées dans Naomi."

        expectTranslated(wrapper.find(Modal).find("#instructions"), expectedEnglish, expectedFrench, store);
    });

    it("translates validation feedback", () => {
        const store =  createStore();
        const wrapper = mount(ShareProject, {
            propsData: {
                project: {id: 1, name: "p1"}
            },
            store: store
        });

        const link = wrapper.find("a");
        link.trigger("click");
        const expectedEnglish  = "This email address is not registered with Naomi";
        const expectedFrench = "Cette adresse e-mail n'est pas enregistrée dans Naomi"

        expectTranslated(wrapper.find(Modal).find(".text-danger"), expectedEnglish, expectedFrench, store);
    });

    it("translates button text", () => {
        const store = createStore();
        const wrapper = mount(ShareProject, {
            propsData: {
                project: {id: 1, name: "p1"}
            },
            store: store
        });

        const link = wrapper.find("a");
        link.trigger("click");
        const buttons = wrapper.find(Modal).findAll("button");

        expectTranslated(buttons.at(0), "OK", "OK", store);
        expectTranslated(buttons.at(1), "Cancel", "Annuler", store);
    });

    it("translates help text", () => {
        const store = createStore();
        const wrapper = mount(ShareProject, {
            propsData: {
                project: {id: 1, name: "p1"}
            },
            store: store
        });

        const link = wrapper.find("a");
        link.trigger("click");
        const helpText = wrapper.find(Modal).find(".help-text");

        expectTranslated(helpText, "Please correct or remove invalid email addresses",
            "Veuillez entrer les adresses e-mails valide", store);
    });

});
