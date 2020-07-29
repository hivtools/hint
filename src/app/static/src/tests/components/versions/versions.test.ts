import {VersionsState} from "../../../app/store/versions/versions";
import Vuex from "vuex";
import {mockVersionsState} from "../../mocks";
import {shallowMount} from "@vue/test-utils";
import Versions from "../../../app/components/versions/Versions.vue";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";
import ErrorAlert from "../../../app/components/ErrorAlert.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState} from "../../../app/root";

describe("Versions component", () => {

    const createSut = (state: Partial<VersionsState> = {},
                       mockCreateVersion = jest.fn(),
                       mockSetManageVersions = jest.fn()) => {
        const store =  new Vuex.Store({
            state: emptyState(),
            modules: {
                versions: {
                    namespaced: true,
                    state: mockVersionsState(state),
                    actions: {
                        createVersion: mockCreateVersion
                    },
                    mutations: {
                        SetManageVersions: mockSetManageVersions
                    }
                }
            }
        });
        registerTranslations(store);
        return shallowMount(Versions, {store});
    };

    const currentVersion = {name: "existingVersion", id: 1, snapshots: []};

    it("renders as expected with no current version", () => {
        const wrapper = createSut();
        expect(wrapper.find(LoadingSpinner).exists()).toBe(false);
        expect(wrapper.find("#versions-content").exists()).toBe(true);

        expect(wrapper.find("#versions-header").text()).toBe("Create a new version");
        expect(wrapper.find("input").attributes()["placeholder"]).toBe("Version name");
        expect(wrapper.find("button").text()).toBe("Create version");
        expect(wrapper.find("button").attributes("disabled")).toBe("disabled");
        expect(wrapper.find(ErrorAlert).exists()).toBe(false);
    });

    it("renders as expected with current version", () => {
        const wrapper = createSut({currentVersion});

        expect(wrapper.find("#versions-header").text()).toBe("Create a new version or return to current version (existingVersion)");
        expect(wrapper.find("#versions-header a").exists()).toBe(true);
    });

    it("enables create version button when version name is entered", () => {
        const wrapper = createSut();
        wrapper.find("input").setValue("newVersion");
        expect(wrapper.find("button").attributes("disabled")).toBeUndefined();
    });

    it("displays error if any", () => {
        const error = {error: "error", detail: "detail"};
        const wrapper = createSut({error});
        expect(wrapper.find(ErrorAlert).props()["error"]).toBe(error);
    });

    it("clicking create version button invokes action", () => {
        const mockCreateVersion = jest.fn();
        const wrapper = createSut({}, mockCreateVersion);
        wrapper.find("input").setValue("newVersion");
        wrapper.find("button").trigger("click");

        expect(mockCreateVersion.mock.calls.length).toBe(1);
        expect(mockCreateVersion.mock.calls[0][1]).toBe("newVersion");
    });

    it("clicking back link sets manageVersions", () =>{
        const mockManageVersions = jest.fn();
        const wrapper = createSut({currentVersion}, jest.fn(), mockManageVersions);

        wrapper.find("#versions-header a").trigger("click");

        expect(mockManageVersions.mock.calls.length).toBe(1);
        expect(mockManageVersions.mock.calls[0][1]).toStrictEqual( {"payload": false, "type": "SetManageVersions"});
    });

    it("displays spinner if loading", () => {
        const wrapper = createSut({loading: true});
        expect(wrapper.find(LoadingSpinner).exists()).toBe(true);
        expect(wrapper.find("#versions-content").exists()).toBe(false);
    });

});
