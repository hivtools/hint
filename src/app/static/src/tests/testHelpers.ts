import {mockAxios, mockBaselineState, mockError, mockFailure, mockRootState} from "./mocks";
import {ActionContext, MutationTree, Store} from "vuex";
import {PayloadWithType} from "../app/types";
import {Wrapper} from "@vue/test-utils";
import {RootState} from "../app/root";
import {Language} from "../app/store/translations/locales";
import registerTranslations from "../app/store/translations/registerTranslations";

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
        const rootState = mockRootState();
        await action({commit, state, dispatch, rootState} as any, new FormData());

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

export function expectTranslated(element: Wrapper<any>,
                                 englishText: string,
                                 frenchText: string,
                                 store: Store<RootState>){
    store.state.language = Language.en;
    registerTranslations(store);
    expect(element.text()).toBe(englishText);
    store.state.language = Language.fr;
    registerTranslations(store);
    expect(element.text()).toBe(frenchText);
}
