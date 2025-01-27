import { describe, it, expect } from 'vitest';
import PageControls from '../../../../app/components/plots/timeSeries/PageControl.vue';
import NumberInput from '../../../../app/components/common/NumberInput.vue';
import Vuex from "vuex";
import {mockRootState} from "../../../mocks";
import {mount} from "@vue/test-utils";

describe('PageControls.vue', () => {

    const getWrapper = (props: any) => {
        const store = new Vuex.Store({
            state: mockRootState(),
        });
        return mount(PageControls, {
            props: props,
            global: {
                plugins: [store],
            }
        });
    }

    it('disables the "Previous" button on the first page', () => {
        const wrapper = getWrapper({
            pageNumber: 1,
            totalPages: 10,
        });

        const prevButton = wrapper.find('#previous-page');
        expect(prevButton.attributes('disabled')).toBeDefined();
    });

    it('disables the "Next" button on the last page', () => {
        const wrapper = getWrapper({
            pageNumber: 10,
            totalPages: 10,
        });

        const nextButton = wrapper.find('#next-page');
        expect(nextButton.attributes('disabled')).toBeDefined();
    });

    it('emits "set-page" with the correct value when "Previous" or "Next" is clicked', async () => {
        const wrapper = getWrapper({
            pageNumber: 5,
            totalPages: 10,
        });

        await wrapper.find('#previous-page').trigger('click');
        expect(wrapper.emitted('set-page')![0]).toEqual([4]);

        await wrapper.find('#next-page').trigger('click');
        await expect(wrapper.emitted('set-page')![1]).toEqual([6]);
    });

    it('emits "set-page" with the correct value when the number input is changed', async () => {
        const wrapper = getWrapper({
            pageNumber: 5,
            totalPages: 10,
        });

        const numberInput = wrapper.findComponent(NumberInput);
        numberInput.vm.$emit('set-value', 7);
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('set-page')![0]).toEqual([7]); // Value from the number input
    });

    it('renders total pages text correctly', () => {
        const wrapper = getWrapper({
            pageNumber: 5,
            totalPages: 10,
        });

        const totalPagesText = wrapper.find('#page-number-end');
        expect(totalPagesText.text()).toBe('of 10');
    });
});
