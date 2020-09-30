import Vuex, {ActionTree, MutationTree} from "vuex";
import {mockModelCalibrateState, mockRootState} from "../../mocks";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {ModelCalibrateState} from "../../../app/store/modelCalibrate/modelCalibrate";;
import {shallowMount} from "@vue/test-utils";
import ModelCalibrate from "../../../app/components/modelCalibrate/ModelCalibrate.vue";

describe("Model calibrate component", () => {
    const getWrapper = (state: Partial<ModelCalibrateState>) => {
        const store = new Vuex.Store({
            state: mockRootState(),
            modules: {
                modelOptions: {
                    namespaced: true,
                    state: mockModelCalibrateState(state)
                }
            }
        });
        registerTranslations(store);
        return shallowMount(ModelCalibrate, {store});
    };

    it("renders as expected when loading", () => {

    });
});
