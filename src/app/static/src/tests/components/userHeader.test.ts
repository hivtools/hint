import {shallowMount} from "@vue/test-utils";
import UserHeader from "../../app/components/UserHeader.vue";
import Vuex from "vuex";
import {
    mockAncResponse,
    mockBaselineState,
    mockModelRunState,
    mockPJNZResponse,
    mockPopulationResponse,
    mockProgramResponse,
    mockShapeResponse,
    mockSurveyAndProgramState,
    mockSurveyResponse
} from "../mocks";
import Vue from "vue";

Vue.use(Vuex);
window.URL.createObjectURL = jest.fn(() => "test.url");

describe("user header", () => {

    const createStore = () => {
        return new Vuex.Store({
            modules: {
                baseline: {
                    namespaced: true,
                    state: mockBaselineState({
                        population: mockPopulationResponse({hash: "1.csv"}),
                        pjnz: mockPJNZResponse({hash: "2.csv"}),
                        shape: mockShapeResponse({hash: "3.csv"})
                    })
                },
                surveyAndProgram: {
                    namespaced: true,
                    state: mockSurveyAndProgramState({
                        survey: mockSurveyResponse({hash: "4.csv"}),
                        program: mockProgramResponse({hash: "5.csv"}),
                        anc: mockAncResponse({hash: "6.csv"})
                    })
                },
                modelRun: {
                    namespaced: true,
                    state: mockModelRunState()
                }
            }
        });
    };

    it("toggles dropdown on click", () => {
        const wrapper = shallowMount(UserHeader);
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu"]);
        wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu", "show"]);
        wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu"]);
    });

    it("closes dropdown on blur", () => {
        const wrapper = shallowMount(UserHeader);
        wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu", "show"]);
        wrapper.find(".dropdown-toggle").trigger("blur");
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu"]);
    });

    it("contains logout link", () => {
        const wrapper = shallowMount(UserHeader);
        expect(wrapper.find("a[href='/logout']")).toBeDefined();
    });

    it("downloads file", () => {
        const wrapper = shallowMount(UserHeader,
            {
                propsData: {title: "naomi"},
                store: createStore()
            });

        wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu", "show"]);
        let link = wrapper.findAll(".dropdown-item").at(0);
        link.trigger("mousedown");

        link = wrapper.findAll(".dropdown-item").at(0);

        const expectedBlob = new Blob([JSON.stringify({
            state: {modelRun: mockModelRunState()}, hashes: {
                pjnz: "2.csv",
                population: "1.csv",
                shape: "3.csv",
                survey: "4.csv",
                program: "5.csv",
                anc: "6.csv"
            }
        })], {type: "application/json"});
        expect((window.URL.createObjectURL as jest.Mock).mock.calls[0][0]).toStrictEqual(expectedBlob);

        const hiddenLink = wrapper.find({ref: "save"});
        expect(hiddenLink.attributes("href")).toBe('test.url');

        const re = new RegExp("naomi-(.*)\.json");
        expect((hiddenLink.attributes("download") as string).match(re)).toBeDefined();
    });

});
