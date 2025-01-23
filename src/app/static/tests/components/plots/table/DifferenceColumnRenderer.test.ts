import { mount } from '@vue/test-utils';
import DifferenceColumnRenderer from "../../../../src/components/plots/table/DifferenceColumnRenderer.vue";
import {DIFFERENCE_NEGATIVE_COLOR, DIFFERENCE_POSITIVE_COLOR} from "../../../../src/components/plots/table/utils";

describe('DifferenceColumnRenderer', () => {
    function createWrapper(value: number, valueFormatted: string) {
        return mount(DifferenceColumnRenderer, {
            props: {
                params: {
                    value,
                    valueFormatted
                }
            }
        });
    }

    it('displays an upward blue arrow for positive values', () => {
        const wrapper = createWrapper(10, '+10');

        const icon = wrapper.find('.cell-icon');
        expect(icon.exists()).toBe(true);
        expect(icon.text()).toBe('▲');
        expect((icon.element as HTMLElement).style.color).toBe(DIFFERENCE_POSITIVE_COLOR);
        expect(wrapper.text()).toContain('+10');
    });

    it('displays a downward red triangle for negative values', () => {
        const wrapper = createWrapper(-5, '-5');

        const icon = wrapper.find('.cell-icon');
        expect(icon.exists()).toBe(true);
        expect(icon.text()).toBe('▼');
        expect((icon.element as HTMLElement).style.color).toBe(DIFFERENCE_NEGATIVE_COLOR);
        expect(wrapper.text()).toContain('-5');
    });

    it('displays no icon for zero value', () => {
        const wrapper = createWrapper(0, '0');

        const icon = wrapper.find('.cell-icon');
        expect(icon.exists()).toBe(false);
        expect(wrapper.text()).toContain('0');
    });
});
