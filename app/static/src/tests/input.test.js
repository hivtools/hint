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
            expect(request.url).toBe("/validate");
            expect(request.data).toBe("modelJson={\"parameters\":{\"error\":\"\",\"a\":20,\"b\":3,\"time\":1,\"poll\":100,\"valid\":false},\"csv_data\":[\"a,b\",\"1,2\",\"2,3\",\"3,4\"]}");
            done();
        });

    });

    it('emits validated event after successful validation', (done) => {
        mockAxios.onPost('/validate')
            .reply(200, {success: true});
        const wrapper = mount(inputForm);

        wrapper.find('[type=submit]').trigger("click");

        setTimeout(() => {
            expect(mockAxios.history.post.length).toBe(1);
            expect(wrapper.emitted().validated).toBeDefined();
            expect(wrapper.find(".alert.alert-danger").exists()).toBe(false);
            expect(wrapper.find(".alert.alert-success").exists()).toBe(true);
            done();
        });

    });


});
