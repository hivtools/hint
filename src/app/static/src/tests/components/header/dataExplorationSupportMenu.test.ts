import {createLocalVue, mount, shallowMount} from "@vue/test-utils";
import Vuex from "vuex";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {expectErrorReportOpen, expectTranslated} from "../../testHelpers";
import DropDown from "../../../app/components/header/DropDown.vue";
import VueRouter from 'vue-router'
import DataExplorationSupportMenu from "../../../app/components/header/DataExplorationSupportMenu.vue"
import {mockDataExplorationState, mockErrorsState} from "../../mocks";
import ErrorReport from "../../../app/components/ErrorReport.vue";

const localVue = createLocalVue()
localVue.use(VueRouter)
const router = new VueRouter()

describe("Data exploration online support menu", () => {

    afterEach(() => {
        jest.resetAllMocks();
    });

    const mockGenerateErrorReport = jest.fn()

    const createStore = () => {
        const store = new Vuex.Store({
            state: mockDataExplorationState(),
            actions: {
                generateErrorReport: mockGenerateErrorReport
            },
            modules: {
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
        const wrapper = shallowMount(DataExplorationSupportMenu, {
            store,
            localVue,
            router
        });

        const dropDown = wrapper.find(DropDown);
        expect(dropDown.props("delay")).toBe(true);
    });

    it("renders drop down text correctly", () => {
        const store = createStore();
        const wrapper = mount(DataExplorationSupportMenu, {
            store,
            localVue,
            router
        });
        wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes())
            .toStrictEqual(["dropdown-menu", "show", "dropdown-menu-right"]);

        const link = wrapper.find(".dropdown").findAll("a");

        expect(link.length).toBe(3)

        expectTranslated(link.at(0),
            "Online support",
            "Support en ligne",
            "Apoio online",
            store as any);

        expectTranslated(link.at(1),
            "Troubleshooting request",
            "Demande de dépannage",
            "Solicitação de solução de problemas",
            store as any);

        expectTranslated(link.at(2),
            "Accessibility",
            "Accessibilité",
            "Acessibilidade",
            store as any);
    });

    it("renders drop down text correctly", () => {
        const store = createStore();
        const wrapper = mount(DataExplorationSupportMenu, {
            store,
            localVue,
            router
        });
        wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes())
            .toStrictEqual(["dropdown-menu", "show", "dropdown-menu-right"]);

        const link = wrapper.find(".dropdown").findAll("a");

        expect(link.length).toBe(3)

        expectTranslated(link.at(0),
            "Online support",
            "Support en ligne",
            "Apoio online",
            store as any);
    });

    it("renders accessibility menu-item text and link", () => {
        const store = createStore();
        const wrapper = shallowMount(DataExplorationSupportMenu, {
            store,
            localVue,
            router
        });

        const link = wrapper.find("router-link-stub");
        expect(link.attributes("to")).toBe("/accessibility");
    });

    it("renders error report widget", () => {

        const store = createStore();
        const wrapper = shallowMount(DataExplorationSupportMenu, {
            store,
            localVue,
            router
        });

        expect(wrapper.findAll(ErrorReport).length).toBe(1);
        expect(wrapper.find(ErrorReport).props("open")).toBe(false);

        const link = wrapper.findAll(".dropdown-item").at(0);

        expectTranslated(link, "Troubleshooting request", "Demande de dépannage", "Solicitação de solução de problemas", store as any);

        expectErrorReportOpen(wrapper)
    });

    it("selects current step by default", () => {
        const store = createStore();
        const wrapper = mount(DataExplorationSupportMenu, {
            store,
            localVue,
            router
        });

        expectErrorReportOpen(wrapper)
    });

    it("invokes generateErrorReport with expected data", async () => {

        const store = createStore();
        const wrapper = mount(DataExplorationSupportMenu, {
            store,
            localVue,
            router
        });

        expectErrorReportOpen(wrapper)

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
                section: "dataExploration",
                stepsToReproduce: "reproduce steps",
                email: ""
            }
        )
    });

});