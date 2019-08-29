import axios, {AxiosError, AxiosResponse} from "axios";
import {InternalResponse} from "./types";
import {
    Failure,
    InitialiseModelRunResponse,
    ModelRunResultResponse,
    ValidateInputResponse
} from "./generated";
import {Commit} from "vuex";

type ResponseData =
    ValidateInputResponse
    | ModelRunResultResponse
    | InitialiseModelRunResponse
    | InternalResponse
    | Boolean

declare var appUrl: string;

export interface API {

    commitFirstErrorAsType: (commit: Commit, type: string) => API
    ignoreErrors: () => API

    postAndReturn<T extends ResponseData>(url: string, data: any): Promise<void | T>

    get<T extends ResponseData>(url: string): Promise<void | T>
}

export class APIService implements API {

    // appUrl will be set as a jest global during testing
    private readonly _baseUrl = typeof appUrl !== "undefined" ? appUrl : "";

    private _buildFullUrl = (url: string) => {
        return this._baseUrl + url
    };

    private _ignoreErrors: Boolean = false;

    private _notifyOnError: ((failure: Failure) => void) = (failure: Failure) => {
        const firstError = failure.errors[0];
        const firstErrorMessage = firstError.detail ? firstError.detail : firstError.error;
        throw new Error(firstErrorMessage);
    };

    commitFirstErrorAsType = (commit: Commit, type: string) => {
        // allows the consumer of the api service to commit
        // an action with the error as a payload rather than
        // throwing the error
        this._notifyOnError = (failure: Failure) => {
            const firstError = failure.errors[0];
            const firstErrorMessage = firstError.detail ? firstError.detail : firstError.error;
            commit({type: type, payload: firstErrorMessage});
        };
        return this
    };

    ignoreErrors = () => {
        this._ignoreErrors = true;
        return this;
    };

    private _handleAxiosResponse(promise: Promise<AxiosResponse>) {
        return promise.then((response: AxiosResponse) => {
            const success = response && response.data;
            return success.data
        }).catch((e: AxiosError) => {
            return this._handleError(e)
        });
    }

    private _handleError = (e: AxiosError) => {
        console.log(e);
        if (this._ignoreErrors) {
            return
        }
        const failure = e.response && e.response.data as Failure;
        if (!failure) {
            throw new Error("Could not parse API response");
        }
        this._notifyOnError(failure);
    };

    async get<T extends ResponseData>(url: string): Promise<void | T> {
        const fullUrl = this._buildFullUrl(url);
        return this._handleAxiosResponse(axios.get(fullUrl));
    }

    async postAndReturn<T extends ResponseData>(url: string, data: any): Promise<void | T> {
        const fullUrl = this._buildFullUrl(url);
        return this._handleAxiosResponse(axios.post(fullUrl, data));
    }

}

export const api = (): API => new APIService();
