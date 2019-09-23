import {mockAxios, mockFailure} from "./mocks";
import {ActionContext} from "vuex";
import {initialBaselineState} from "../app/store/baseline/baseline";
import {mutations} from "../app/store/baseline/mutations";

export function testUploadErrorCommitted(url: string,
                                         expectedErrorType: string,
                                         expectedSuccessType: string,
                                         action: (store: ActionContext<any, any>, formData: FormData) => void) {

    it(`commits error message when ${url} fails`, async () => {

        mockAxios.onPost(url)
            .reply(500, mockFailure("Something went wrong"));

        const commit = jest.fn();
        await action({commit} as any, new FormData());

        // first a call to clear the data
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: expectedSuccessType,
            payload: null
        });
        // second a call to set the error
        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: expectedErrorType,
            payload: "Something went wrong"
        });
    });
}
