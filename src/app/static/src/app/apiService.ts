import axios, {AxiosError, AxiosResponse} from "axios";
import {ErrorsMutation} from "./store/errors/mutations";
import {ActionContext, Commit} from "vuex";
import {freezer, isHINTResponse} from "./utils";
import {Error, Response} from "./generated";
import {TranslatableState} from "./root";
import i18next from "i18next";

declare let appUrl: string;

export interface ResponseWithType<T> extends Response {
    data: T
}

export interface API<S, E> {

    withError: (type: E) => API<S, E>
    withSuccess: (type: S, root: boolean) => API<S, E>
    ignoreErrors: () => API<S, E>
    ignoreSuccess: () => API<S, E>

    postAndReturn<T>(url: string, data: any): Promise<void | ResponseWithType<T>>

    get<T>(url: string): Promise<void | ResponseWithType<T>>

    delete(url: string): Promise<void | true>
}

export class APIService<S extends string, E extends string> implements API<S, E> {

    private readonly _commit: Commit;
    private readonly _headers: any;

    constructor(context: ActionContext<any, TranslatableState>) {
        this._commit = context.commit;
        this._headers = {"Accept-Language": context.rootState.language};
    }

    // appUrl will be set as a jest global during testing
    private readonly _baseUrl = typeof appUrl !== "undefined" ? appUrl : "";

    private _buildFullUrl = (url: string) => {
        return this._baseUrl + url
    };

    private _ignoreErrors = false;
    private _ignoreSuccess = false;
    private _freezeResponse = false;

    static getFirstErrorFromFailure = (failure: Response) => {
        if (failure.errors.length == 0) {
            return APIService.createError("apiMissingError");
        }
        return failure.errors[0];
    };

    static createError(detail: string) {
        return {
            error: "MALFORMED_RESPONSE",
            detail: i18next.t(detail)
        }
    }

    private _onError: ((failure: Response) => void) | null = null;

    private _onSuccess: ((success: Response) => void) | null = null;

    freezeResponse = () => {
        this._freezeResponse = true;
        return this;
    };

    withError = (type: E, root = false) => {
        this._onError = (failure: Response) => {
            this._commit({type: type, payload: APIService.getFirstErrorFromFailure(failure)}, {root});
        };
        return this;
    };

    ignoreErrors = () => {
        this._ignoreErrors = true;
        return this;
    };

    ignoreSuccess = () => {
        this._ignoreSuccess = true;
        return this;
    };

    withSuccess = (type: S, root = false) => {
        this._onSuccess = (data: any) => {
            const finalData = this._freezeResponse ? freezer.deepFreeze(data) : data;
            const toCommit = {type: type, payload: finalData};
            if (root) {
                this._commit(toCommit, {root: true});
            } else {
                this._commit(toCommit);
            }

        };
        return this;
    };

    private _handleAxiosResponse(promise: Promise<AxiosResponse>) {
        return promise.then((axiosResponse: AxiosResponse) => {
            const success = axiosResponse && axiosResponse.data;
            const data = success.data;
            if (this._onSuccess) {
                this._onSuccess(data);
            }
            return axiosResponse.data;
        }).catch((e: AxiosError) => {
            return this._handleError(e)
        });
    }

    private _handleError = (e: AxiosError) => {
        console.log(e.response && e.response.data || e);
        if (this._ignoreErrors) {
            return
        }

        if (e.response && e.response.status == 401) {
            window.location.assign("/login")
        }

        let failure = e.response && e.response.data;
        /*
        if (!failure && e.response && e.response.status == 401) {
            failure = {
                status: "failure",
                errors: [{
                    error: "SESSION_TIMEOUT",
                    detail: i18next.t("sessionExpired")
                }
                ],
                data: {}
            }
        }
         */

        if(!isHINTResponse(failure)){
            this._commitError(APIService.createError("apiCouldNotParseError"));
        }
        else if (this._onError) {
            this._onError(failure);
        } else {
            this._commitError(APIService.getFirstErrorFromFailure(failure));
        }
    };

    private _commitError = (error: Error) => {
        this._commit({type: `errors/${ErrorsMutation.ErrorAdded}`, payload: error}, {root: true});
    };

    private _verifyHandlers(url: string) {
        if (this._onError == null && !this._ignoreErrors) {
            console.warn(`No error handler registered for request ${url}.`)
        }
        if (this._onSuccess == null && !this._ignoreSuccess) {
            console.warn(`No success handler registered for request ${url}.`)
        }
    }

    async get<T>(url: string): Promise<void | ResponseWithType<T>> {
        this._verifyHandlers(url);
        const fullUrl = this._buildFullUrl(url);
        return this._handleAxiosResponse(axios.get(fullUrl, {headers: this._headers}));
    }

    async postAndReturn<T>(url: string, data?: any): Promise<void | ResponseWithType<T>> {
        this._verifyHandlers(url);
        const fullUrl = this._buildFullUrl(url);

        // this allows us to pass data of type FormData in both the browser and
        // in node for testing, using the "form-data" package in the latter case
        const headers = data && typeof data.getHeaders == "function" ?
            {...this._headers, ...data.getHeaders()}
            : this._headers;

        return this._handleAxiosResponse(axios.post(fullUrl, data, {headers}));
    }

    async delete(url: string) {
        const fullUrl = this._buildFullUrl(url);
        return this._handleAxiosResponse(axios.delete(fullUrl));
    }

}

export const api =
    <S extends string, E extends string>(context: ActionContext<any, TranslatableState>) => new APIService<S, E>(context);
