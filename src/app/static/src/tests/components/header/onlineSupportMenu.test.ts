import {createLocalVue, mount, shallowMount, Wrapper} from "@vue/test-utils";
import Vuex from "vuex";
import OnlineSupportMenu from "../../../app/components/header/OnlineSupportMenu.vue";
import {emptyState} from "../../../app/root";
import {mutations} from "../../../app/store/root/mutations";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {Language} from "../../../app/store/translations/locales";
import {expectTranslated, expectErrorReportOpen} from "../../testHelpers";
import DropDown from "../../../app/components/header/DropDown.vue";
import VueRouter from 'vue-router'
import ErrorReport from "../../../app/components/ErrorReport.vue";
import {mockErrorsState, mockProjectsState, mockStepperState} from "../../mocks";
import {StepperState} from "../../../app/store/stepper/stepper";

const localVue = createLocalVue()
localVue.use(VueRouter)
const router = new VueRouter()


describe("Online support menu", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    const mockGenerateErrorReport = jest.fn()

    const createStore = (stepperState: Partial<StepperState> = {}) => {
        const store = new Vuex.Store({
            state: emptyState(),
            actions: {
                generateErrorReport: mockGenerateErrorReport
            },
            mutations: mutations,
            modules: {
                stepper: {
                    namespaced: true,
                    state: mockStepperState(stepperState)
                },
                projects: {
                    namespaced: true,
                    state: mockProjectsState()
                },
                errors: {
                    namespaced: true,
                    state: mockErrorsState()
                }
            },
            getters: {
                isGuest: () => false
            }
        });
        registerTranslations(store);
        return store;
    };

    it("renders drop down with delay property true", () => {
        const store = createStore();
        const wrapper = shallowMount(OnlineSupportMenu, {
            store,
            localVue,
            router
        });

        const dropDown = wrapper.find(DropDown);
        expect(dropDown.props("delay")).toBe(true);
    });

    it("renders drop down text correctly", () => {
        const store = createStore();
        const wrapper = mount(OnlineSupportMenu, {
            store,
            localVue,
            router
        });
        wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes())
            .toStrictEqual(["dropdown-menu", "show", "dropdown-menu-right"]);

        const link = wrapper.find(".dropdown").find("a");
        expectTranslated(link, "Online support", "Support en ligne",
            "Apoio online", store as any);
    });

    it("renders FAQ menu-item text", () => {
        const store = createStore();
        const wrapper = shallowMount(OnlineSupportMenu, {
            store,
            localVue,
            router
        });

        const link = wrapper.findAll(".dropdown-item").at(0);
        expectTranslated(link, "FAQ", "FAQ", "Perguntas Frequentes", store as any);
        expect(link.attributes("target")).toBe("_blank");
    });

    it("renders FAQ menu-item link href when language is English", () => {
        const store = createStore();
        const wrapper = shallowMount(OnlineSupportMenu, {
            store,
            localVue,
            router
        });

        const link = wrapper.findAll(".dropdown-item").at(0);
        expect(link.attributes("href")).toBe("https://mrc-ide.github.io/naomi-troubleshooting/index-en.html");
    });

    it("renders FAQ menu-item link href when lang is French", () => {
        const store = createStore();
        store.state.language = Language.fr;
        const wrapper = shallowMount(OnlineSupportMenu, {
            store,
            localVue,
            router
        });

        const link = wrapper.findAll(".dropdown-item").at(0);
        expect(link.attributes("href")).toBe("https://mrc-ide.github.io/naomi-troubleshooting/index-fr.html");
    });

    it("renders FAQ menu-item link href when language is Portuguese", () => {
        const store = createStore();
        store.state.language = Language.pt;
        const wrapper = shallowMount(OnlineSupportMenu, {
            store,
            localVue,
            router
        });

        const link = wrapper.findAll(".dropdown-item").at(0);
        // This will eventually link to Portuguese language FAQ doc, but using English doc for now
        expect(link.attributes("href")).toBe("https://mrc-ide.github.io/naomi-troubleshooting/index-en.html");
    });

    it("renders error report widget", () => {

        const store = createStore();
        const wrapper = shallowMount(OnlineSupportMenu, {
            store,
            localVue,
            router
        });

        expect(wrapper.findAll(ErrorReport).length).toBe(1);
        expect(wrapper.find(ErrorReport).props("open")).toBe(false);

        const link = wrapper.findAll(".dropdown-item").at(1);

        expectTranslated(link, "Troubleshooting request", "Demande de dépannage", "Solicitação de solução de problemas", store as any);

        expectErrorReportOpen(wrapper, 1)
    });

    it("can render section on error report widget", () => {
        const store = createStore();
        const wrapper = mount(OnlineSupportMenu, {
            store,
            localVue,
            router
        });

        expect(wrapper.findAll(ErrorReport).length).toBe(1);

        expect(wrapper.find(ErrorReport).props("open")).toBe(false);

        expectErrorReportOpen(wrapper, 1)

        const options = wrapper.find(ErrorReport).findAll("option")
        expect(options.length).toBe(10)

        expect((options.at(0).element as HTMLOptionElement).value).toBe("uploadInputs");

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
});

    it("selects current step by default", () => {
        const store = createStore();
        const wrapper = mount(OnlineSupportMenu, {
            store,
            localVue,
            router
        });

        expectErrorReportOpen(wrapper, 1)

        expect((wrapper.find(ErrorReport).find("select#section").element as HTMLSelectElement).value)
            .toBe("uploadInputs")
    });

    it("invokes generateErrorReport with expected data", async () => {
        const store = createStore();
        const wrapper = mount(OnlineSupportMenu, {
            store,
            localVue,
            router
        });

        expectErrorReportOpen(wrapper, 1)

        await wrapper.find(ErrorReport).vm.$emit("send",
            {
                description: "something",
                stepsToReproduce: "reproduce steps",
                email: ""
            })

        expect(mockGenerateErrorReport).toHaveBeenCalledTimes(1)

        await expect(mockGenerateErrorReport.mock.calls[0][1]).toEqual(
            {
                description: "something",
                section: "uploadInputs",
                stepsToReproduce: "reproduce steps",
                email: ""
            }
        )
        expect(wrapper.vm.$data.section).toBe("")
    });

    it("can update section", () => {
        const store = createStore({activeStep: 2});
        const wrapper = mount(OnlineSupportMenu, {
            store,
            localVue,
            router
        });

        expect((wrapper.find("select#section").element as HTMLSelectElement).value)
            .toBe("reviewInputs");

        wrapper.find("#section").setValue("downloadResults");

        expect((wrapper.find("select#section").element as HTMLSelectElement).value)
            .toBe("downloadResults");
        expect(wrapper.vm.$data.section).toBe("downloadResults");
        expect((wrapper.vm as any).currentSection).toBe("downloadResults");
    });

    it("sets section to 'projects' if opened on project page",  () => {
        const localVue = createLocalVue()
        localVue.use(VueRouter)
        const routes = [
            {
                path: '/',
                component: ErrorReport
            },
            {
                path: '/projects',
                component: ErrorReport
            }
        ]
        const router = new VueRouter({
            routes
        })

        const wrapper = mount(OnlineSupportMenu,
            {
                localVue,
                router,
                store: createStore()
            })
        expect(wrapper.vm.$route.path).toBe("/");
        wrapper.setData({errorReportOpen: true});
        expect((wrapper.find(ErrorReport).find("#section").element as HTMLSelectElement).value).toBe("uploadInputs");

        wrapper.setData({errorReportOpen: false});
        router.push("/projects");
        expectErrorReportOpen(wrapper, 1)
        expect(wrapper.find(ErrorReport).props("open")).toBe(true);
        expect((wrapper.find("#section").element as HTMLSelectElement).value).toBe("projects")
    });

    it("renders accessibility menu-item text and link", () => {
        const store = createStore();
        const wrapper = shallowMount(OnlineSupportMenu, {
            store,
            localVue,
            router
        });

        const link = wrapper.find("router-link-stub");
        expect(link.attributes("to")).toBe("/accessibility");
        expectTranslated(link, "Accessibility", "Accessibilité", "Acessibilidade", store as any);
    });

});