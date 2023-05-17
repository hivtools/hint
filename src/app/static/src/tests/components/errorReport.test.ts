import Vue from "vue";
import {shallowMount, mount} from '@vue/test-utils';
import ErrorReport from "../../app/components/ErrorReport.vue";
import Modal from "../../app/components/Modal.vue";
import Vuex from "vuex";
import {mockErrorsState, mockProjectsState, mockRootState, mockStepperState} from "../mocks";
import registerTranslations from "../../app/store/translations/registerTranslations";
import {StepDescription, StepperState} from "../../app/store/stepper/stepper";
import {ProjectsState} from "../../app/store/projects/projects";
import {expectTranslated} from "../testHelpers";
import VueRouter, { createRouter, createWebHashHistory } from "vue-router";
import {Language} from "../../app/store/translations/locales";
import ErrorAlert from "../../app/components/ErrorAlert.vue";
import {RootState} from "../../app/root";
import { ErrorsState } from "../../app/store/errors/errors";
import LoadingSpinner from "../../app/components/LoadingSpinner.vue";
import {emailRegex, mapStateProp} from "../../app/utils";

describe("Error report component", () => {

    const createStore = (stepperState: Partial<StepperState> = {},
                         projectsState: Partial<ProjectsState> = {},
                         rootState: Partial<RootState> = {},
                         isGuest = false,
                         errorsState: Partial<ErrorsState> ={}) => {
        const store = new Vuex.Store({
            state: mockRootState(rootState),
            modules: {
                stepper: {
                    namespaced: true,
                    state: mockStepperState(stepperState)
                },
                projects: {
                    namespaced: true,
                    state: mockProjectsState(projectsState)
                },
                errors: {
                    namespaced: true,
                    state: mockErrorsState(errorsState)
                }
            },
            getters: {
                isGuest: () => isGuest
            }
        });
        registerTranslations(store);
        return store;
    };

    afterEach(() => {
        jest.resetAllMocks();
    });

    const rootSectionSlot = {
        name: 'sectionView',
        template: `
            <div>
            <label for="section" v-translate="'section'"></label>
            <select class="form-control"
                    v-model="currentSection"
                    id="section">
                <option v-for="step in steps"
                        :key="step.number"
                        :value="step.textKey"
                        v-translate="step.textKey">
                </option>
                <option key="login"
                        v-translate="'login'"
                        value="login"></option>
                <option key="projects" v-translate="'projects'"
                        value="projects"></option>
                <option key="other"
                        value="other"
                        v-translate="'other'"></option>
            </select>
            </div>
        `,
        data() {
            return {
                section: '',
            }
        },
        computed: {
            currentSectionKey: {
                get() {
                    return mapStateProp<StepperState, string>("stepper",
                        state => state.steps[state.activeStep - 1].textKey)
                }
            },
            currentSection: {
                get() {
                    return rootSectionSlot.data().section || rootSectionSlot.computed.currentSectionKey
                },
                set (newVal: string) {
                    rootSectionSlot.data().section = newVal
                }
            },
            steps: mapStateProp<StepperState, StepDescription[]>("stepper", state => state.steps)
        }
    }

    const projectSlot = {
        name: 'projectView',
        template: `
            <div v-if="projectName"><label for="project" v-translate="'project'"></label>
            <input type="text" disabled id="project" :value="projectName" class="form-control"/>
            </div>
        `,
        computed: {
            projectName: mapStateProp<ProjectsState, string | undefined>("projects",
                    state => state.currentProject?.name)
        }
    }

    it("modal is open when prop is true", () => {
        const wrapper = shallowMount(ErrorReport, {
            props: {
                open: true
            },
            store: createStore()
        });

        expect(wrapper.findComponent(Modal).props("open")).toBe(true);
    });

    it("modal is closed when prop is false", () => {
        const wrapper = shallowMount(ErrorReport, {
            props: {
                open: false
            },
            store: createStore()
        });

        expect(wrapper.findComponent(Modal).props("open")).toBe(false);
    });

    it("renders steps as options with project, login and other as extra sections", () => {
        const store = createStore()
        const wrapper = shallowMount(ErrorReport, {
            props: {
                open: true
            },
            store,
            slots: {
                sectionView: rootSectionSlot
            }
        });
        const options = wrapper.findAllComponents("option");

        expect((options[0].element as HTMLOptionElement).value).toBe("uploadInputs");
        expect((options[1].element as HTMLOptionElement).value).toBe("reviewInputs");
        expect((options[6].element as HTMLOptionElement).value).toBe("downloadResults");
        expect((options[7].element as HTMLOptionElement).value).toBe("login");
        expect((options[8].element as HTMLOptionElement).value).toBe("projects");
        expect((options[9].element as HTMLOptionElement).value).toBe("other");
    });

    it(`renders modal text in English, French and Portuguese`, () => {
        const store = createStore({}, {currentProject: {name: "p1", id: 1, versions: []}}, {}, true)
        const wrapper = shallowMount(ErrorReport, {
            props: {
                open: true
            },
            store,
            slots: {
                sectionView: rootSectionSlot,
                projectView: projectSlot
            }
        });

        expectTranslated(wrapper.findComponent("h4"),
            "Troubleshooting request",
            "Demande de dépannage",
            "Solicitação de solução de problemas",
            store)

        const labels = wrapper.findAllComponents("label")
        expect(labels.length).toBe(5)

        expectTranslated(labels[0],
            "Project",
            "Projet",
            "Projeto",
            store)

        expectTranslated(labels[1],
            "Email address",
            "Adresse e-mail",
            "Endereço de e-mail",
            store)

        expectTranslated(labels[2],
            "Section",
            "Section",
            "Seção",
            store)

        expectTranslated(labels[3],
            "Description",
            "La description",
            "Descrição",
            store)

        expectTranslated(labels[4],
            "Steps to reproduce",
            "Étapes à reproduire",
            "Passos para reproduzir",
            store)

        const mutedText = wrapper.findAllComponents("div.small.text-muted")

        expect(mutedText.length).toBe(2)

        expectTranslated(mutedText[0],
            "Please include details about what you were trying to do, the expected result and what actually happened.",
            "Veuillez inclure des détails sur ce que vous essayiez de faire, le résultat attendu et ce qui s'est réellement passé.",
            "Inclua detalhes sobre o que você estava tentando fazer, o resultado esperado e o que realmente aconteceu.",
            store)

        expectTranslated(mutedText[1],
            "Describe how to reproduce the error so another person could follow your steps.",
            "Décrivez comment reproduire l'erreur afin qu'une autre personne puisse suivre vos étapes.",
            "Descreva como reproduzir o erro para que outra pessoa possa seguir seus passos.",
            store)
    })

    it("renders modal buttons in English, French and Portuguese", () => {
        const store = createStore()

        const wrapper = mount(ErrorReport, {
            props: {
                open: true
            },
            store
        });

        const buttons = wrapper.findAllComponents("button")

        expect(buttons.length).toBe(2)

        expectTranslated(buttons[0],
            "Send",
            "Envoyer",
            "Mandar",
            store)

        expectTranslated(buttons[1],
            "Cancel",
            "Annuler",
            "Cancelar",
            store)
    });

    it(`renders modal options in English, French and Portuguese`, () => {
        const store = createStore()

        const wrapper = shallowMount(ErrorReport, {
            props: {
                open: true
            },
            store,
            slots: {
                sectionView: rootSectionSlot
            }
        });
        const options = wrapper.findAllComponents("option");
        expect(options.length).toBe(10);
    })

    it("shows email field if user is guest", () => {
        const wrapper = shallowMount(ErrorReport, {
            props: {
                open: true
            },
            store: createStore({}, {}, {}, true)
        });

        expect(wrapper.findAllComponents("input#email").length).toBe(1);
    });

    it("does not shows email field if user is logged in", () => {
        const wrapper = shallowMount(ErrorReport, {
            props: {
                open: true
            },
            store: createStore({}, {}, {}, false)
        });

        expect(wrapper.findAllComponents("input#email").length).toBe(0);
    });

    it("email field is not required if user is logged in", () => {
        const wrapper = mount(ErrorReport, {
            props: {
                open: true
            },
            store: createStore({}, {}, {}, false)
        });

        wrapper.findComponent("#description").setValue("something");
        wrapper.findComponent("#reproduce").setValue("reproduce steps");

        expect(wrapper.findAllComponents("button").length).toBe(2);
        expect(wrapper.findAllComponents("button")[0].attributes().disabled).toBeUndefined();
    });

    it("email field is required if user is not logged in", () => {
        const wrapper = mount(ErrorReport, {
            props: {
                open: true
            },
            store: createStore({}, {}, {}, true)
        });

        wrapper.findComponent("#description").setValue("something");
        wrapper.findComponent("#reproduce").setValue("reproduce steps");

        expect(wrapper.findAllComponents("input#email").length).toBe(1);
        expect(wrapper.findAllComponents("button").length).toBe(2);
        expect(wrapper.findAllComponents("button")[0].attributes().disabled).toBe("disabled");
    });

    it("description field is required", () => {
        const wrapper = mount(ErrorReport, {
            props: {
                open: true
            },
            store: createStore({}, {}, {}, true)
        });

        wrapper.findComponent("#reproduce").setValue("reproduce steps");
        wrapper.findComponent("#email").setValue("test@test.com");

        expect(wrapper.findAllComponents("button").length).toBe(2);
        expect(wrapper.findAllComponents("button")[0].attributes().disabled).toBe("disabled");
    });

    it("reproduce steps field is required", () => {
        const wrapper = mount(ErrorReport, {
            props: {
                open: true
            },
            store: createStore({}, {}, {}, true)
        });

        wrapper.findComponent("#description").setValue("desc");
        wrapper.findComponent("#email").setValue("test@test.com");

        expect(wrapper.findAllComponents("button").length).toBe(2);
        expect(wrapper.findAllComponents("button")[0].attributes().disabled).toBe("disabled");
    });

    it("translates button tooltip", () => {
        const store = createStore({}, {}, {}, true);
        const mockTooltip = jest.fn();
        mount(ErrorReport, {
            props: {
                open: true
            },
            store,
            directives: {"tooltip": mockTooltip}
        });

        expect(mockTooltip.mock.calls[0][1].value).toBe("Please fill out all fields to proceed");

        store.state.language = Language.fr

        expect(mockTooltip.mock.calls[1][1].value).toBe("Veuillez remplir tous les champs");

        store.state.language = Language.pt

        expect(mockTooltip.mock.calls[2][1].value).toBe("Por favor, preencha todos os campos");
    });

    it("shows disabled, auto-populated project field if there is a current project", () => {
        const wrapper = shallowMount(ErrorReport, {
            props: {
                open: true
            },
            store: createStore({}, {currentProject: {name: "p1", id: 1, versions: []}}, {}, false),
            slots: {
                projectView: projectSlot
            }
        });

        expect(wrapper.findAllComponents("input#project").length).toBe(1);
        const el = wrapper.findComponent("input#project").element as HTMLInputElement
        expect(el.value).toBe("p1");
        expect(el.disabled).toBe(true);
    });

    it("does not show project field if there is no current project", () => {
        const wrapper = shallowMount(ErrorReport, {
            props: {
                open: true
            },
            store: createStore({}, {}, {}, true),
            slots: {
                projectView: projectSlot
            }
        });

        expect(wrapper.findAllComponents("input#project").length).toBe(0);
    });

    it("does not show project field", () => {
        const wrapper = shallowMount(ErrorReport, {
            props: {
                open: true
            },
            store: createStore({}, {}, {}, true)
        });

        expect(wrapper.findComponent("input#project").exists()).toBe(false);
    });

    it("does not show section field by default", () => {
        const wrapper = shallowMount(ErrorReport, {
            props: {
                open: true
            },
            store: createStore({}, {}, {}, true)
        });

        expect(wrapper.findComponent("#section").exists()).toBe(false);
    });

    it("emits close event on cancel", () => {
        const wrapper = mount(ErrorReport, {
            props: {
                open: true
            },
            store: createStore()
        });

        expect(wrapper.findComponent(".btn-white").text()).toBe("Cancel");
        wrapper.findComponent(".btn-white").trigger("click");

        expect(wrapper.emitted().close).toBeDefined();
    });

    it("resets data on cancel", () => {
        const wrapper = mount(ErrorReport, {
            props: {
                open: true
            },
            store: createStore({}, {}, {}, true),
            slots: {
                sectionView: rootSectionSlot
            }
        });

        wrapper.findComponent("#description").setValue("something");
        wrapper.findComponent("#reproduce").setValue("reproduce steps");
        wrapper.findComponent("#section").setValue("downloadResults");
        wrapper.findComponent("#email").setValue("test@email.com");

        expect(wrapper.vm.$data.description).toBe("something");
        expect(wrapper.vm.$data.stepsToReproduce).toBe("reproduce steps");
        expect(wrapper.vm.$data.email).toBe("test@email.com");

        wrapper.findComponent(".btn-white").trigger("click");

        expect(wrapper.vm.$data.description).toBe("");
        expect(wrapper.vm.$data.stepsToReproduce).toBe("");
        expect(wrapper.vm.$data.email).toBe("");
    });

    it("resets data on send", async () => {
        const wrapper = mount(ErrorReport, {
            props: {
                open: true
            },
            store: createStore({}, {}, {}, true)
        });

        wrapper.findComponent("#description").setValue("something");
        wrapper.findComponent("#reproduce").setValue("reproduce steps");
        wrapper.findComponent("#email").setValue("test@email.com");

        expect(wrapper.vm.$data.description).toBe("something");
        expect(wrapper.vm.$data.stepsToReproduce).toBe("reproduce steps");
        expect(wrapper.vm.$data.email).toBe("test@email.com");

        wrapper.findComponent(".btn-red").trigger("click");
        await Vue.nextTick();

        expect(wrapper.vm.$data.description).toBe("");
        expect(wrapper.vm.$data.stepsToReproduce).toBe("");
        expect(wrapper.vm.$data.email).toBe("");
    });

    it("can validate email with whitespace", async () => {
        const store = createStore({}, {}, {}, true)
        const wrapper = mount(ErrorReport, {
            props: {
                open: true
            },
            store
        });

        wrapper.findComponent("#email").setValue("tes t@email.com ");
        expect(wrapper.vm.$data.email).toBe("test@email.com");
        expect(wrapper.findComponent(".invalid-feedback").exists()).toBe(false)
    });

    it("does not validate email with one letter postfix", async () => {
        const store = createStore({}, {}, {}, true)
        const wrapper = mount(ErrorReport, {
            props: {
                open: true
            },
            store,
            slots: {
                sectionView: rootSectionSlot
            }
        });

        wrapper.findComponent("#description").setValue("something");
        wrapper.findComponent("#reproduce").setValue("reproduce steps");
        wrapper.findComponent("#section").setValue("downloadResults");
        wrapper.findComponent("#email").setValue("test@email.c");

        expect(wrapper.findComponent(".btn-red").text()).toBe("Send");
        expect(wrapper.findComponent(".btn-red").attributes("disabled")).toBe("disabled")

        const invalidFeedback = wrapper.findComponent(".invalid-feedback");
        expectTranslated(invalidFeedback,
            "Please enter a valid email address",
            "S'il vous plaît, mettez une adresse email valide",
            "Por favor insira um endereço de e-mail válido", store)
    });

    it("does not validate email without @ symbol", async () => {
        const store = createStore({}, {}, {}, true)
        const wrapper = mount(ErrorReport, {
            props: {
                open: true
            },
            store,
            slots: {
                sectionView: rootSectionSlot
            }
        });

        wrapper.findComponent("#description").setValue("something");
        wrapper.findComponent("#reproduce").setValue("reproduce steps");
        wrapper.findComponent("#section").setValue("downloadResults");
        wrapper.findComponent("#email").setValue("testemail.com");

        expect(wrapper.findComponent(".btn-red").text()).toBe("Send");
        expect(wrapper.findComponent(".btn-red").attributes("disabled")).toBe("disabled")

        const invalidFeedback = wrapper.findComponent(".invalid-feedback");
        expectTranslated(invalidFeedback,
            "Please enter a valid email address",
            "S'il vous plaît, mettez une adresse email valide",
            "Por favor insira um endereço de e-mail válido", store)
    });

    it("disables button and display email validation message when invalid email address", async () => {
        const store = createStore({}, {}, {}, true)
        const wrapper = mount(ErrorReport, {
            props: {
                open: true
            },
            store,
            slots: {
                sectionView: rootSectionSlot
            }
        });

        wrapper.findComponent("#description").setValue("something");
        wrapper.findComponent("#reproduce").setValue("reproduce steps");
        wrapper.findComponent("#section").setValue("downloadResults");
        wrapper.findComponent("#email").setValue("test@email.c");

        expect(wrapper.findComponent("#email").attributes("pattern")).toBe(emailRegex.source)
        expect(wrapper.findComponent(".btn-red").text()).toBe("Send");
        expect(wrapper.findComponent(".btn-red").attributes("disabled")).toBe("disabled")

        const invalidFeedback = wrapper.findComponent(".invalid-feedback");
        expectTranslated(invalidFeedback,
            "Please enter a valid email address",
            "S'il vous plaît, mettez une adresse email valide",
            "Por favor insira um endereço de e-mail válido", store)
    });


    it("validates email and enables send button ", async () => {
        const store = createStore({}, {}, {}, true)
        const wrapper = mount(ErrorReport, {
            props: {
                open: true
            },
            store,
            slots: {
                sectionView: rootSectionSlot
            }
        });

        wrapper.findComponent("#description").setValue("something");
        wrapper.findComponent("#reproduce").setValue("reproduce steps");
        wrapper.findComponent("#section").setValue("downloadResults");
        wrapper.findComponent("#email").setValue("test@email.com");

        expect(wrapper.findComponent("#email").attributes("pattern")).toBe(emailRegex.source)
        expect(wrapper.findComponent(".btn-red").text()).toBe("Send");
        expect(wrapper.findComponent(".btn-red").attributes("disabled")).toBeUndefined()
        expect(wrapper.findComponent(".invalid-feedback").exists()).toBe(false)
    });

    it("emits action and sets showFeedback on send", async () => {
        const wrapper = mount(ErrorReport, {
            props: {
                open: true
            },
            store: createStore(),
            slots: {
                sectionView: rootSectionSlot
            }
        });

        wrapper.findComponent("#description").setValue("something");
        wrapper.findComponent("#reproduce").setValue("reproduce steps");
        wrapper.findComponent("#section").setValue("downloadResults");

        expect(wrapper.findComponent(".btn-red").text()).toBe("Send");
        wrapper.findComponent(".btn-red").trigger("click");
        await Vue.nextTick();

        expect(wrapper.emitted("send")!.length).toBe(1)
        expect(wrapper.emitted("send")![0][0]).toStrictEqual(
            {
                description: "something",
                stepsToReproduce: "reproduce steps",
                email: ""
            }
        )

        expect((wrapper.vm as any).showFeedback).toBe(true);
        expect(wrapper.emitted().close).toBeUndefined();
    });

    it("disables send button and render spinner when sending error report",  () => {
        const store = createStore({}, {}, {}, false, {sendingErrorReport: true})
        const wrapper = mount(ErrorReport, {
            props: {
                open: true,
                email: "something"
            },
            store: store,
            slots: {
                sectionView: rootSectionSlot
            }
        });

        wrapper.findComponent("#description").setValue("something");
        wrapper.findComponent("#reproduce").setValue("reproduce steps");
        wrapper.findComponent("#section").setValue("downloadResults");

        expect(wrapper.findComponent(LoadingSpinner).exists()).toBe(true)
        expectTranslated(wrapper.findComponent("#sending-error-report"),
            "Sending request...", "Envoyer une requete...", "Enviando pedido ...", store)
        expect(wrapper.findComponent("#send").attributes("disabled")).toBe("disabled")
    });

    it("does not disable send button or render spinner when sending error report is not in progress",  () => {
        const wrapper = mount(ErrorReport, {
            props: {
                open: true,
                email: "something"
            },
            store: createStore(),
            slots: {
                sectionView: rootSectionSlot
            }
        });

        wrapper.findComponent("#description").setValue("something");
        wrapper.findComponent("#reproduce").setValue("reproduce steps");
        wrapper.findComponent("#section").setValue("downloadResults");

        expect(wrapper.findComponent(LoadingSpinner).exists()).toBe(false)
        expect(wrapper.findComponent("#send").attributes("disabled")).toBeUndefined()
    });

    it("does not emit action on cancel", () => {
        const wrapper = mount(ErrorReport, {
            props: {
                open: true
            },
            store: createStore()
        });
        
        expect(wrapper.findComponent(".btn-white").text()).toBe("Cancel");
        wrapper.findComponent(".btn-white").trigger("click");

        expect(wrapper.emitted("send")!).toBeUndefined()
    });

    it("renders no feedback by default", () => {
        const wrapper = shallowMount(ErrorReport, {
            props: {
                open: true
            },
            store: createStore()
        });
        expect(wrapper.findComponent("#report-success").exists()).toBe(false);
        expect(wrapper.findComponent("#report-error").exists()).toBe(false);
        expect(wrapper.findComponent(ErrorAlert).exists()).toBe(false);
    });

    it("renders success feedback when no error report error", () => {
        const wrapper = mount(ErrorReport, {
            props: {
                open: true
            },
            store: createStore()
        });
        wrapper.setData({showFeedback: true});

        expectTranslated(wrapper.findComponent("#report-success"),
            "Thank you, your request has been sent. We will respond as soon as possible.",
            "Merci, votre demande a été envoyé. Nous vous répondrons dans les plus brefs délais.",
            "Obrigado, sua solicitação foi enviada. Nós responderemos o mais rapidamente possível.",
            wrapper.vm.$store
        );
        expectTranslated(wrapper.findComponent(".btn-red"), "Close", "Fermer", "Fechar",
            wrapper.vm.$store);
        expect(wrapper.findComponent("#report-error").exists()).toBe(false);
        expect(wrapper.findComponent(ErrorAlert).exists()).toBe(false);
    });

    it("renders error feedback when there is an error report error", () => {
        const errorReportError = {
            error: "TEST ERROR",
            detail: "TEST DETAIL"
        };
        const wrapper = mount(ErrorReport, {
            props: {
                open: true
            },
            store: createStore({}, {}, {}, false, {errorReportError})
        });
        wrapper.setData({showFeedback: true});
        expectTranslated(wrapper.findComponent("#report-error"),
            "An error occurred while sending your request:",
            "Une erreur s'est produite lors de l'envoi de votre demande :",
            "Ocorreu um erro ao enviar sua solicitação:",
            wrapper.vm.$store
        );
        expect(wrapper.findComponent(ErrorAlert).props("error")).toBe(errorReportError);
        expectTranslated(wrapper.findComponent(".btn-red"), "Close", "Fermer", "Fechar",
            wrapper.vm.$store);
        expect(wrapper.findComponent("#report-success").exists()).toBe(false);
    });

    it("emits close event on click close button", () => {
        const wrapper = mount(ErrorReport, {
            props: {
                open: true
            },
            store: createStore()
        });
        wrapper.setData({showFeedback: true});

        expect(wrapper.findComponent(".btn-red").text()).toBe("Close");
        wrapper.findComponent(".btn-red").trigger("click");

        expect(wrapper.emitted().close).toBeDefined();
    });

    it("resets showFeedback on open", () => {
        const router = createRouter({routes: [], history: createWebHashHistory() });
        const wrapper = mount(ErrorReport, { router, store: createStore() });
        wrapper.setData({showFeedback: true});

        wrapper.setProps({open: true});
        expect((wrapper.vm as any).showFeedback).toBe(false);
    });
});
