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
                       mockSetFakeCurrentVersion = jest.fn()) => {
        const store =  new Vuex.Store({
            state: emptyState(),
            modules: {
                versions: {
                    namespaced: true,
                    state: mockVersionsState(state),
                    mutations: {
                        SetFakeCurrentVersion: mockSetFakeCurrentVersion
                    }
                }
            }
        });
        registerTranslations(store);
        return shallowMount(Versions, {store});
    };

    const currentVersion = {name: "existingVersion", id: 1, snapshots: []};

    it("renders as expected ", () => {
        const wrapper = createSut();

        expect(wrapper.find("button").text()).toBe("Create version");
    });


    it("clicking create version button commits mutation", () => {
        const mockSetVersion = jest.fn();
        const wrapper = createSut({}, mockSetVersion);
        wrapper.find("button").trigger("click");

        expect(mockSetVersion.mock.calls.length).toBe(1);
    });

});
