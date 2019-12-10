import {mockAxios, mockBaselineState, mockError, mockFailure} from "./mocks";
import {ActionContext, MutationTree} from "vuex";
import {PayloadWithType} from "../app/types";
import i18next from "i18next";
import {Wrapper} from "@vue/test-utils";
import Translated from "../app/components/Translated.vue";

export function expectEqualsFrozen(args: PayloadWithType<any>, expected: PayloadWithType<any>) {
    expect(Object.isFrozen(args["payload"])).toBe(true);
    expect(args).toStrictEqual(expected);
}

export function testUploadErrorCommitted(url: string,
                                         expectedErrorType: string,
                                         expectedSuccessType: string,
                                         action: (store: ActionContext<any, any>, formData: FormData) => void) {

    it(`commits error message when ${url} fails`, async () => {

        mockAxios.onPost(url)
            .reply(500, mockFailure("Something went wrong"));

        const commit = jest.fn();
        const state = mockBaselineState();
        const dispatch = jest.fn();
        await action({commit, state, dispatch} as any, new FormData());

        // first call to clear the data
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: expectedSuccessType,
            payload: null
        });

        // then a call to set the error
        expect(commit.mock.calls[1][0]).toStrictEqual({
            type: expectedErrorType,
            payload: mockError("Something went wrong")
        });
    });
}

export function expectAllMutationsDefined(mutationDefinitions: any, mutationTree: MutationTree<any>) {

    const missing: string[] = [];
    Object.keys(mutationDefinitions).forEach(k => {
        const mutationName = mutationDefinitions[k];
        if (!mutationTree[mutationName]) {
            missing.push(mutationName);
        }
    });

    if (missing.length > 0) {
        throw Error(`The following mutations were declared but not defined: ${missing.join(",")}`)
    }
}

export function expectTranslatedText(wrapper: Wrapper<any>, expected: string) {
    const text = wrapper.find(Translated).props("textKey");
    expect(i18next.t(text)).toBe(expected);
}
