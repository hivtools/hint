import {mount, shallowMount} from "@vue/test-utils";
import ShareProject from "../../../app/components/projects/ShareProject.vue";
import Modal from "../../../app/components/Modal.vue";
import Vuex from "vuex";
import {emptyState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";
import {expectTranslated} from "../../testHelpers";

describe("ShareProject", () => {

    const createStore = () => {
        const store = new Vuex.Store({
            state: emptyState()
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
        const store = wrapper.vm.$store;

        expect(wrapper.find(Modal).props("open")).toBe(false);
        const link = wrapper.find("a");
        expectTranslated(link, "Share" ,"Partager", store);
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

    it("if emails are invalid, validation feedback is shown and no action taken", () => {
        const wrapper = mount(ShareProject, {
            propsData: {
                project: {id: 1, name: "p1"}
            },
            store: createStore()
        });

        const link = wrapper.find("a");
        link.trigger("click");
        wrapper.find(Modal).find("input").setValue("bademail");
        wrapper.find(Modal).findAll("button").at(0).trigger("click");
        expect(wrapper.find(Modal).props("open")).toBe(true);
        expect(wrapper.find(Modal).findAll(LoadingSpinner).length).toBe(0);
        expect(wrapper.find(Modal).find("input").classes()).toContain("is-invalid");
    });

    it("if emails are valid, project is shared", (done) => {
        const wrapper = mount(ShareProject, {
            propsData: {
                project: {id: 1, name: "p1"}
            },
            store: createStore()
        });

        const link = wrapper.find("a");
        link.trigger("click");
        wrapper.find(Modal).find("input").setValue("goodemail@gmail.com");
        wrapper.find(Modal).findAll("button").at(0).trigger("click");
        expect(wrapper.find(Modal).props("open")).toBe(true);
        expect(wrapper.find(Modal).findAll(LoadingSpinner).length).toBe(1);

        setTimeout(() => {
            expect(wrapper.find(Modal).props("open")).toBe(false);
            expect(wrapper.find(Modal).findAll(LoadingSpinner).length).toBe(0);
            done();
        }, 200)
    });

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
        "Please enter the email address or comma separated list of email addresses you would like to share " +
        "this project with. These email addresses must be already registered with Naomi."

        const expectedFrench = "Cela créera une copie de p1 pour les utilisateurs désignés." +
            "Veuillez entrer une adresse e-mail ou une liste d'adresses séparées par des virgules " +
            "avec lesquelles vous souhaitez partager ce projet. Ces addresses e-mails doivent être déjà enregistrées dans Naomi."

        expectTranslated(wrapper.find(Modal).find("#instructions"), expectedEnglish, expectedFrench, store);
    });

    it("translates validation feedback", () => {
        const store = createStore();
        const wrapper = shallowMount(ShareProject, {
            propsData: {
                project: {id: 1, name: "p1"}
            },
            store: store
        });

        const link = wrapper.find("a");
        link.trigger("click");
        const expectedEnglish  = "Please enter valid, comma separated email addresses";
        const expectedFrench = "Veuillez entrer une adresse e-mail valide."

        expectTranslated(wrapper.find(Modal).find(".invalid-feedback"), expectedEnglish, expectedFrench, store);
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

        expectTranslated(helpText, "e.g. john.doe@gmail.com, dr.smith@hotmail.com",
            "par ex. john.doe@gmail.com, dr.smith@hotmail.com", store);
    });

});
