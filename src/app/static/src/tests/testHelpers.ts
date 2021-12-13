import {mockAxios, mockBaselineState, mockError, mockFailure, mockRootState} from "./mocks";
import {ActionContext, MutationTree, Store} from "vuex";
import {PayloadWithType, TranslatableState} from "../app/types";
import {Wrapper} from "@vue/test-utils";
import {RootState} from "../app/root";
import {Language} from "../app/store/translations/locales";
import registerTranslations from "../app/store/translations/registerTranslations";
import {LanguageMutation} from "../app/store/language/mutations";
import Mock = jest.Mock;

export function expectEqualsFrozen(args: PayloadWithType<any>, expected: PayloadWithType<any>) {
    expect(Object.isFrozen(args["payload"])).toBe(true);
    expect(args).toStrictEqual(expected);
}

export function testUploadErrorCommitted(url: string,
                                         expectedErrorType: string,
                                         expectedSuccessType: string,
                                         expectedErroredFileType: string,
                                         expectedErroredFilename: string,
                                         formData: any,
                                         action: (store: ActionContext<any, any>, formData: FormData) => void) {

    it(`commits error message when ${url} fails`, async () => {

        mockAxios.onPost(url)
            .reply(500, mockFailure("Something went wrong"));

        const commit = jest.fn();
        const state = mockBaselineState();
        const dispatch = jest.fn();
        const rootState = mockRootState();
        await action({commit, state, dispatch, rootState} as any, formData);

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

        expect(commit.mock.calls[2][0]).toStrictEqual({
            type: expectedErroredFileType,
            payload: expectedErroredFilename
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

export function expectTranslatedWithStoreType<T extends TranslatableState>(element: Wrapper<any>,
                                                                           englishText: string,
                                                                           frenchText: string,
                                                                           portugueseText: string,
                                                                           store: Store<T>,
                                                                           attribute?: string) {
    store.state.language = Language.en;
    registerTranslations(store);
    const value = () => attribute ? element.attributes(attribute) : element.text();
    expect(value()).toBe(englishText);

    store.state.language = Language.fr;
    registerTranslations(store);
    expect(value()).toBe(frenchText);

    store.state.language = Language.pt;
    registerTranslations(store);
    expect(value()).toBe(portugueseText);
}

export const expectTranslated = (element: Wrapper<any>,
                                 englishText: string,
                                 frenchText: string,
                                 portugueseText: string,
                                 store: Store<RootState>,
                                 attribute?: string) =>
    expectTranslatedWithStoreType<RootState>(element, englishText, frenchText, portugueseText, store, attribute);

export const expectChangeLanguageMutations = (commit: Mock) => {
    expect(commit.mock.calls[0][0]).toStrictEqual({
        type: LanguageMutation.SetUpdatingLanguage,
        payload: true
    });
    expect(commit.mock.calls[1][0]).toStrictEqual({
        type: LanguageMutation.ChangeLanguage,
        payload: "fr"
    });

    expect(commit.mock.calls[2][0]).toStrictEqual({
        type: LanguageMutation.SetUpdatingLanguage,
        payload: false
    });
};
