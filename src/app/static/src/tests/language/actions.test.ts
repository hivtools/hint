import {actions} from "../../app/store/language/actions";
import {Language} from "../../app/store/translations/locales";
import {LanguageMutation} from "../../app/store/language/mutations";

describe("Language actions", () => {

    it("changes language", async () => {
        const commit = jest.fn();
        await actions.changeLanguage({commit} as any, Language.fr);
        expect(commit.mock.calls[0][0]).toStrictEqual({
            type: LanguageMutation.ChangeLanguage,
            payload: "fr"
        })
    });

});
