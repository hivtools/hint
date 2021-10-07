import {shallowMount, mount} from '@vue/test-utils';
import ErrorReport from "../../app/components/ErrorReport.vue";
import Modal from "../../app/components/Modal.vue";
import Vuex from "vuex";
import {mockProjectsState, mockRootState, mockStepperState} from "../mocks";
import registerTranslations from "../../app/store/translations/registerTranslations";
import {StepperState} from "../../app/store/stepper/stepper";
import {ProjectsState} from "../../app/store/projects/projects";
import {expectTranslated} from "../testHelpers";

describe("Error report component", () => {

    const createStore = (stepperState: Partial<StepperState> = {},
                         projectsState: Partial<ProjectsState> = {},
                         isGuest = false) => {
        const store = new Vuex.Store({
            state: mockRootState(),
            modules: {
                stepper: {
                    namespaced: true,
                    state: mockStepperState(stepperState)
                },
                projects: {
                    namespaced: true,
                    state: mockProjectsState(projectsState)
                }
            },
            getters: {
                isGuest: () => isGuest
            }
        });
        registerTranslations(store);
        return store;
    };

    it("modal is open when prop is true", () => {
        const wrapper = shallowMount(ErrorReport, {
            propsData: {
                open: true
            },
            store: createStore()
        });

        expect(wrapper.find(Modal).props("open")).toBe(true);
    });

    it("modal is closed when prop is false", () => {
        const wrapper = shallowMount(ErrorReport, {
            propsData: {
                open: false
            },
            store: createStore()
        });

        expect(wrapper.find(Modal).props("open")).toBe(false);
    });

    it("renders steps as options with project, login and other as extra sections", () => {
        const store = createStore()
        const wrapper = shallowMount(ErrorReport, {
            propsData: {
                open: true
            },
            store
        });
        const options = wrapper.findAll("option");

        expect(options.length).toBe(10);
        expect(options.at(0).text()).toBe("Upload inputs");
        expect(options.at(1).text()).toBe("Review inputs");
        expect(options.at(6).text()).toBe("Save results");
        expect(options.at(7).text()).toBe("Login");
        expect(options.at(8).text()).toBe("Projects");
        expect(options.at(9).text()).toBe("Other");

        expect((options.at(0).element as HTMLOptionElement).value).toBe("uploadInputs");
        expect((options.at(1).element as HTMLOptionElement).value).toBe("reviewInputs");
        expect((options.at(6).element as HTMLOptionElement).value).toBe("downloadResults");
        expect((options.at(7).element as HTMLOptionElement).value).toBe("login");
        expect((options.at(8).element as HTMLOptionElement).value).toBe("projects");
        expect((options.at(9).element as HTMLOptionElement).value).toBe("other");
    });

    it(`renders modal text in English, French and Portuguese`, () => {
        const store = createStore({}, {currentProject: {name: "p1", id: 1, versions: []}}, true)
        const wrapper = shallowMount(ErrorReport, {
            propsData: {
                open: true
            },
            store
        });

        expectTranslated(wrapper.find("h4"),
            "Report issues",
            "Signaler des problèmes",
            "Reportar problemas",
            store)

        const labels = wrapper.findAll("label")
        expectTranslated(labels.at(0),
            "Project",
            "Projet",
            "Projeto",
            store)

        expectTranslated(labels.at(1),
            "Email address",
            "Adresse e-mail",
            "Endereço de e-mail",
            store)

        expectTranslated(labels.at(2),
            "Section",
            "Section",
            "Seção",
            store)

        expectTranslated(labels.at(3),
            "Description",
            "La description",
            "Descrição",
            store)

        expectTranslated(labels.at(4),
            "Steps to reproduce",
            "Étapes à reproduire",
            "Reportar problemas",
            store)

        const mutedText = wrapper.findAll("div.small.text-muted")

        expect(mutedText.length).toBe(2)

        expectTranslated(mutedText.at(0),
            "Please include details about what you were trying to do, the expected result and what actually happened.",
            "Veuillez inclure des détails sur ce que vous essayiez de faire, le résultat attendu et ce qui s'est réellement passé.",
            "Inclua detalhes sobre o que você estava tentando fazer, o resultado esperado e o que realmente aconteceu.",
            store)

        expectTranslated(mutedText.at(1),
            "Describe how to reproduce the error so another person could follow your steps.",
            "Décrivez comment reproduire l'erreur afin qu'une autre personne puisse suivre vos étapes.",
            "Descreva como reproduzir o erro para que outra pessoa possa seguir seus passos.",
            store)
    })

    it("renders modal buttons in English, French and Portuguese", () => {
        const store = createStore()

        const wrapper = mount(ErrorReport, {
            propsData: {
                open: true
            },
            store
        });

        const buttons = wrapper.findAll("button")

        expect(buttons.length).toBe(2)

        expectTranslated(buttons.at(0),
            "Send",
            "Envoyer",
            "Mandar",
            store)

        expectTranslated(buttons.at(1),
            "Cancel",
            "Annuler",
            "Cancelar",
            store)
    });

    it(`renders modal options in English, French and Portuguese`, () => {
        const store = createStore({}, {currentProject: {name: "p1", id: 1, versions: []}}, false)

        const wrapper = shallowMount(ErrorReport, {
            propsData: {
                open: true
            },
            store
        });
        const options = wrapper.findAll("option");

        expect(options.length).toBe(10);

        expectTranslated(options.at(0),
            "Upload inputs",
            "Télécharger les entrées",
            "Carregar entradas",
            store)

        expectTranslated(options.at(1),
            "Review inputs",
            "Examiner les entrées",
            "Analise as entradas",
            store)

        expectTranslated(options.at(2),
            "Model options",
            "Options des modèles",
            "Opções de modelos",
            store)

        expectTranslated(options.at(3),
            "Fit model",
            "Ajuster le modèle",
            "Ajustar modelo",
            store)

        expectTranslated(options.at(4),
            "Calibrate model",
            "Calibrer le modèle",
            "Calibrar modelo",
            store)

        expectTranslated(options.at(5),
            "Review output",
            "Résultat de l'examen",
            "Rever os resultados",
            store)

        expectTranslated(options.at(6),
            "Save results",
            "Enregistrer les résultats",
            "Guardar resultados",
            store)

        expectTranslated(options.at(7),
            "Login",
            "Connexion",
            "Conecte-se",
            store)

        expectTranslated(options.at(8),
            "Projects",
            "Projets",
            "Projetos",
            store)

        expectTranslated(options.at(9),
            "Other",
            "Autre",
            "De outros",
            store)
    })

    it("selects current step by default", () => {
        const wrapper = shallowMount(ErrorReport, {
            propsData: {
                open: true
            },
            store: createStore({activeStep: 2})
        });

        expect((wrapper.find("select#section").element as HTMLSelectElement).value)
            .toBe("reviewInputs")
    });

    it("can update section", () => {
        const wrapper = shallowMount(ErrorReport, {
            propsData: {
                open: true
            },
            store: createStore({activeStep: 2})
        });

        expect((wrapper.find("select#section").element as HTMLSelectElement).value)
            .toBe("reviewInputs");

        wrapper.find("#section").setValue("downloadResults");

        expect((wrapper.find("select#section").element as HTMLSelectElement).value)
            .toBe("downloadResults");
        expect(wrapper.vm.$data.section).toBe("downloadResults");
        expect((wrapper.vm as any).currentSection).toBe("downloadResults");
    });

    it("shows email field if user is guest", () => {
        const wrapper = shallowMount(ErrorReport, {
            propsData: {
                open: true
            },
            store: createStore({}, {}, true)
        });

        expect(wrapper.findAll("input#email").length).toBe(1);
    });

    it("does not shows email field if user is logged in", () => {
        const wrapper = shallowMount(ErrorReport, {
            propsData: {
                open: true
            },
            store: createStore({}, {}, false)
        });

        expect(wrapper.findAll("input#email").length).toBe(0);
    });

    it("shows disabled, auto-populated project field if there is a current project", () => {
        const wrapper = shallowMount(ErrorReport, {
            propsData: {
                open: true
            },
            store: createStore({}, {currentProject: {name: "p1", id: 1, versions: []}}, false)
        });

        expect(wrapper.findAll("input#project").length).toBe(1);
        const el = wrapper.find("input#project").element as HTMLInputElement
        expect(el.value).toBe("p1");
        expect(el.disabled).toBe(true);
    });

    it("does not show project field if there is no current project", () => {
        const wrapper = shallowMount(ErrorReport, {
            propsData: {
                open: true
            },
            store: createStore({}, {}, true)
        });

        expect(wrapper.findAll("input#project").length).toBe(0);
    });

    it("emits close event on cancel", () => {
        const wrapper = mount(ErrorReport, {
            propsData: {
                open: true
            },
            store: createStore()
        });

        expect(wrapper.find(".btn-white").text()).toBe("Cancel");
        wrapper.find(".btn-white").trigger("click");

        expect(wrapper.emitted().close).toBeDefined();
    });

    it("emits close event on send", () => {
        const wrapper = mount(ErrorReport, {
            propsData: {
                open: true
            },
            store: createStore()
        });

        expect(wrapper.find(".btn-red").text()).toBe("Send");
        wrapper.find(".btn-red").trigger("click");

        expect(wrapper.emitted().close).toBeDefined();
    });

    it("resets data on cancel", () => {
        const wrapper = mount(ErrorReport, {
            propsData: {
                open: true
            },
            store: createStore({}, {}, true)
        });

        wrapper.find("#description").setValue("something");
        wrapper.find("#reproduce").setValue("reproduce steps");
        wrapper.find("#section").setValue("downloadResults");
        wrapper.find("#email").setValue("test@email.com");

        expect(wrapper.vm.$data.description).toBe("something");
        expect(wrapper.vm.$data.reproduce).toBe("reproduce steps");
        expect(wrapper.vm.$data.section).toBe("downloadResults");
        expect(wrapper.vm.$data.email).toBe("test@email.com");

        wrapper.find(".btn-white").trigger("click");

        expect(wrapper.vm.$data.description).toBe("");
        expect(wrapper.vm.$data.reproduce).toBe("");
        expect(wrapper.vm.$data.section).toBe("");
        expect(wrapper.vm.$data.email).toBe("");
    });

    it("resets data on send", () => {
        const wrapper = mount(ErrorReport, {
            propsData: {
                open: true
            },
            store: createStore({}, {}, true)
        });

        wrapper.find("#description").setValue("something");
        wrapper.find("#reproduce").setValue("reproduce steps");
        wrapper.find("#section").setValue("downloadResults");
        wrapper.find("#email").setValue("test@email.com");

        expect(wrapper.vm.$data.description).toBe("something");
        expect(wrapper.vm.$data.reproduce).toBe("reproduce steps");
        expect(wrapper.vm.$data.section).toBe("downloadResults");
        expect(wrapper.vm.$data.email).toBe("test@email.com");

        wrapper.find(".btn-red").trigger("click");

        expect(wrapper.vm.$data.description).toBe("");
        expect(wrapper.vm.$data.reproduce).toBe("");
        expect(wrapper.vm.$data.section).toBe("");
        expect(wrapper.vm.$data.email).toBe("");
    });

});
