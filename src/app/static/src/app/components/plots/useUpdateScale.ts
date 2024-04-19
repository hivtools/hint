import {useStore} from "vuex";
import {RootState} from "../../root";
import {ScaleSettings} from "../../store/plotState/plotState";

export const useUpdateScale = () => {
    const store = useStore<RootState>();

    const updateOutputColourScale = (indicator: string, newScaleSettings: ScaleSettings) => {
        store.commit({
            type: 'plotState/updateOutputColourScales',
            payload: {indicatorId: indicator, newScaleSettings}
        })
    };

    return {
        updateOutputColourScale,
    }
};
