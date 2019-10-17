import {shallowMount} from "@vue/test-utils";
import UserHeader from "../../app/components/UserHeader.vue";
import Vuex from "vuex";
import {
    mockAncResponse,
    mockBaselineState,
    mockModelRunState,
    mockLoadState,
    mockPJNZResponse,
    mockPopulationResponse,
    mockProgramResponse,
    mockShapeResponse,
    mockSurveyAndProgramState,
    mockSurveyResponse
} from "../mocks";
import Vue from "vue";

Vue.use(Vuex);
const mockCreateObjectUrl = jest.fn(() => "test.url");
window.URL.createObjectURL = mockCreateObjectUrl;

describe("user header", () => {

    const createStore = () => {
        return new Vuex.Store({
            modules: {
                baseline: {
                    namespaced: true,
                    state: mockBaselineState({
                        population: mockPopulationResponse({hash: "1csv", filename: "1.csv"}),
                        pjnz: mockPJNZResponse({hash: "2csv", filename: "2.csv"}),
                        shape: mockShapeResponse({hash: "3csv", filename: "3.csv"})
                    })
                },
                surveyAndProgram: {
                    namespaced: true,
                    state: mockSurveyAndProgramState({
                        survey: mockSurveyResponse({hash: "4csv", filename: "4.csv"}),
                        program: mockProgramResponse({hash: "5csv", filename: "5.csv"}),
                        anc: mockAncResponse({hash: "6csv", filename: "6.csv"})
                    })
                },
                modelRun: {
                    namespaced: true,
                    state: mockModelRunState()
                },
                load: {
                    namespaced: true,
                    state: mockLoadState()
                }
            }
        });
    };

    it("toggles dropdown on click", () => {
        const wrapper = shallowMount(UserHeader,
            {
                store: createStore()
            });
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu"]);
        wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu", "show"]);
        wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu"]);
    });

    it("closes dropdown on blur", () => {
        const wrapper = shallowMount(UserHeader,
            {
                store: createStore()
            });
        wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu", "show"]);
        wrapper.find(".dropdown-toggle").trigger("blur");
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu"]);
    });

    it("contains logout link", () => {
        const wrapper = shallowMount(UserHeader,
            {
                store: createStore()
            });
        expect(wrapper.find("a[href='/logout']")).toBeDefined();
    });

    it("downloads file", (done) => {
        const wrapper = shallowMount(UserHeader,
            {
                propsData: {title: "naomi"},
                store: createStore()
            });

        wrapper.find(".dropdown-toggle").trigger("click");
        expect(wrapper.find(".dropdown-menu").classes()).toStrictEqual(["dropdown-menu", "show"]);
        let link = wrapper.findAll(".dropdown-item").at(0);
        link.trigger("mousedown");

        const hiddenLink = wrapper.find({ref: "save"});
        expect(hiddenLink.attributes("href")).toBe('test.url');

        const re = new RegExp("naomi-(.*)\.json");
        expect((hiddenLink.attributes("download") as string).match(re)).toBeDefined();

        const expectedJson = JSON.stringify({
            state: {modelRun: mockModelRunState()}, files: {
                pjnz: {hash: "2csv", filename: "2.csv"},
                population: {hash: "1csv", filename: "1.csv"},
                shape: {hash: "3csv", filename: "3.csv"},
                survey: {hash: "4csv", filename: "4.csv"},
                program: {hash: "5csv", filename: "5.csv"},
                anc: {hash: "6csv", filename: "6.csv"}
            }
        });
        const actualBlob = (mockCreateObjectUrl as jest.Mock).mock.calls[0][0];

        const reader = new FileReader();
        reader.addEventListener('loadend', function() {
            const text = reader.result;
            expect(text).toEqual(expectedJson);
            done();
        });
        reader.readAsText(actualBlob);
    });

});
