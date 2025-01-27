import {shallowMount} from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import NumberInput from '../../../app/components/common/NumberInput.vue';

describe('NumberInput.vue', () => {
    it('emits the adjusted value within min and max bounds', async () => {
        const wrapper = shallowMount(NumberInput, {
            props: {
                min: 10,
                max: 100,
                step: 5,
                value: 25,
            },
        });

        const input = wrapper.find('input');

        // Exceeding the max emits max value
        await input.setValue('105');
        expect(wrapper.emitted('set-value')).toBeTruthy();
        expect(wrapper.emitted('set-value')![0]).toEqual([100]);

        // Exceeding the min emits min value
        await input.setValue('5');
        expect(wrapper.emitted('set-value')![1]).toEqual([10]);

        // Rounds to the closest step
        await input.setValue('27');
        expect(wrapper.emitted('set-value')![2]).toEqual([25]);

        // Converts fractional value
        await input.setValue('10.7');
        expect(wrapper.emitted('set-value')).toBeTruthy();
        expect(wrapper.emitted('set-value')![3]).toEqual([10]);

        // Works if entered value matches constraints
        await input.setValue('30');
        expect(wrapper.emitted('set-value')![4]).toEqual([30]);
    });

    it('does not emit if input is invalid (e.g., non-number)', async () => {
        const wrapper = shallowMount(NumberInput, {
            props: {
                min: 0,
                max: 10,
                step: 1,
                value: 5,
            },
        });

        const input = wrapper.find('input');

        await input.setValue('abc');
        expect(wrapper.emitted('set-value')).toBeFalsy();
    });
});
