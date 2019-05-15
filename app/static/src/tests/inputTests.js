import {expect} from "chai";
import {describe} from "mocha";
import {mount} from '@vue/test-utils'
import {mockAxios} from "./mocks";
import inputForm from "../js/components/inputs.vue"

describe("inputForm", () => {

    beforeEach(() => {
        mockAxios.reset();
    });

    it('serialises parameters correctly', (done) => {
        mockAxios.onPost('/validate')
            .reply(200, {success: true});

        const wrapper = mount(inputForm);
        wrapper.find('[type=submit]').trigger("click");

        setTimeout(() => {
            const request = mockAxios.history.post[0];
            expect(request.url).to.eq("/validate");
            expect(request.data).to.eq("modelJson={\"parameters\":{\"error\":\"\",\"a\":20,\"b\":3,\"time\":1,\"poll\":100,\"valid\":false},\"csv_data\":[\"a,b\",\"1,2\",\"2,3\",\"3,4\"]}");
            done();
        });

    });

    it('emits validated event after successful validation', (done) => {
        mockAxios.onPost('/validate')
            .reply(200, {success: true});
        const wrapper = mount(inputForm);

        wrapper.find('[type=submit]').trigger("click");

        setTimeout(() => {
            expect(mockAxios.history.post.length).to.eq(1);
            expect(wrapper.emitted().validated).to.not.eq(undefined);
            expect(wrapper.find(".alert.alert-danger").exists()).to.eq(false);
            expect(wrapper.find(".alert.alert-success").exists()).to.eq(true);
            done();
        });

    });


});
