import {VersionsState} from "../../app/store/versions/versions";
import UserContent from "../../app/components/UserContent.vue";
import Vuex from "vuex";
import {shallowMount} from "@vue/test-utils";
import {mockVersionsState} from "../mocks";
import Versions from "../../app/components/versions/Versions.vue";
import Stepper from "../../app/components/Stepper.vue";

describe("UserContent component", () => {

    const createSut = (user: string, state: Partial<VersionsState>) => {
        const store =  new Vuex.Store({
            modules: {
                versions: {
                    namespaced: true,
                    state: mockVersionsState(state)
                }
            }
        });
        const propsData = {user};
        return shallowMount(UserContent, {store, propsData});
    };

    const currentSnapshot = {id: "testSnapshot", created: "2020-06-29", updated: "2020-06-30"};

    it("renders versions if non-guest user and manageVersions is true", () => {
        const wrapper = createSut("testUser", {manageVersions: true, currentSnapshot});
        expect(wrapper.find(Versions).exists()).toBe(true);
        expect(wrapper.find(Stepper).exists()).toBe(false);
    });

    it("renders versions if non-guest user and currentSnapshot is null", () => {
        const wrapper = createSut("testUser", {manageVersions: false, currentSnapshot: null});
        expect(wrapper.find(Versions).exists()).toBe(true);
        expect(wrapper.find(Stepper).exists()).toBe(false);
    });

    it("renders stepper if guest user", () => {
        const wrapper = createSut("guest", {manageVersions: false, currentSnapshot: null});
        expect(wrapper.find(Versions).exists()).toBe(false);
        expect(wrapper.find(Stepper).exists()).toBe(true);
    });

    it("renders stepper if non-guest user, currentSnapshot exists and manageVersions is false", () =>{
        const wrapper = createSut("testUser", {manageVersions: false, currentSnapshot});
        expect(wrapper.find(Versions).exists()).toBe(false);
        expect(wrapper.find(Stepper).exists()).toBe(true);
    });
});
