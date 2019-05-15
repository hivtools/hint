import {expect} from "chai";
import {describe} from "mocha";
import {mockAxios} from "./mocks";
import {mount} from '@vue/test-utils'
import status from "../js/components/status.vue";
import * as polling from "../js/components/polling";

describe("status", () => {

    beforeEach(() => {
        mockAxios.reset();
    });

    it('does not start polling if runId is null', (done) => {

        const wrapper = mount(status, {
            propsData: {
                runId: null
            }
        });

        setTimeout(() => {
            expect(wrapper.find(".status").exists()).to.eq(false);
            expect(mockAxios.history.get.length).to.eq(0);
            done();
        });
    });

    it('starts polling for status when it receives a runId', (done) => {
        mockAxios.onGet('/status/1234')
            .reply(200, {done: false});

        const wrapper = mount(status, {
            propsData: {
                runId: null
            }
        });

        wrapper.setProps({runId: 1234});

        setTimeout(() => {
            expect(wrapper.find(".status").exists()).to.eq(true);
            expect(mockAxios.history.get.length).to.eq(1);
            done();
        });
    });

    it('emits successful finished event when status is done', (done) => {
        mockAxios.onGet('/status/1234')
            .reply(200, {done: true, success: true});

        const wrapper = mount(status, {
            propsData: {
                runId: 1234
            }
        });

        setTimeout(() => {
            expect(mockAxios.history.get.length).to.eq(1);
            expect(wrapper.emitted().finished[0][0]).to.eq(true);
            expect(wrapper.find(".status").exists()).to.eq(false);
            done();
        });
    });

    it('emits unsuccessful finished event when status is done', (done) => {
        mockAxios.onGet('/status/1234')
            .reply(200, {done: true, success: false});

        const wrapper = mount(status, {
            propsData: {
                runId: 1234
            }
        });

        setTimeout(() => {
            expect(mockAxios.history.get.length).to.eq(1);
            expect(wrapper.emitted().finished[0][0]).to.eq(false);
            expect(wrapper.find(".status").exists()).to.eq(false);
            done();
        });
    });

});