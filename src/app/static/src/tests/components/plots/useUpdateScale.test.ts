import {describe, expect, it, vi} from 'vitest';
import {createStore} from 'vuex';
import {RootState} from "../../../app/root";
import {PlotStateMutations} from "../../../app/store/plotState/mutations";
import {useUpdateScale} from "../../../app/components/plots/useUpdateScale";
import {Scale, ScaleSettings, ScaleType} from "../../../app/store/plotState/plotState";
import {defineComponent} from "vue";
import {shallowMount} from "@vue/test-utils";

describe('useUpdateScale', () => {

    // Mocking getIndicatorMetadata utility
    vi.mock('../../../app/components/plots/utils', () => ({
        getIndicatorMetadata: vi.fn().mockReturnValue({ min: 0, max: 100 })
    }));

    const TestComponent = defineComponent({
        props: {
            activePlot: {
                type: String,
                required: true
            }
        },
        setup(props: any) {
            return {
                ...useUpdateScale(props.activePlot)
            }
        }
    });

    const store = createStore({
        state: {
            plotSelections: {
                bubble: {
                    filters: [
                        { stateFilterId: 'colourIndicator', selection: [{ id: 'someIndicator' }] },
                        { stateFilterId: 'sizeIndicator', selection: [{ id: 'sizeIndicator' }] },
                    ],
                },
            },
        } as RootState,
    });

    const commit = vi.fn();
    store.commit = commit;

    const wrapper = shallowMount(TestComponent, {
        props: {
            activePlot: "bubble"
        },
        global: {
            plugins: [store]
        }
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('calculates colour scale step correctly', () => {
        const scaleStep = wrapper.vm.getScaleStep(Scale.Colour);
        expect(scaleStep).toBe(10);
    });

    it('calculates size scale step correctly', () => {
        const scaleStep = wrapper.vm.getScaleStep(Scale.Size);
        expect(scaleStep).toBe(10);
    });

    it('throws an error when scale is not Colour or Size', () => {
        expect(() => wrapper.vm.getScaleStep('invalidScale' as Scale)).toThrowError(
            new RangeError(`Scale type must be one of 'name' or 'colour', got invalidScale`)
        );
    });

    it('commits the correct mutation when updateOutputScale is called', () => {
        const scale = Scale.Colour;
        const indicatorId = 'someIndicator';
        const newScaleSettings: ScaleSettings = { type: ScaleType.Custom, customMin: 0, customMax: 50 };

        wrapper.vm.updateOutputScale(scale, indicatorId, newScaleSettings);

        expect(commit).toHaveBeenCalledWith({
            type: `plotState/${PlotStateMutations.updateOutputScale}`,
            payload: { scale, indicatorId, newScaleSettings }
        });
    });
});
