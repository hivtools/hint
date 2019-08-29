import axios, {AxiosError, AxiosResponse} from "axios";
import {InternalResponse} from "./types";
import {
    Failure,
    InitialiseModelRunResponse,
    ModelRunResultResponse, Response,
    Success,
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

export class APIService {

    // appUrl var should be set externally in the browser
    private readonly _baseUrl = typeof appUrl !== "undefined" ? appUrl : "";

    private _ignoreErrors: Boolean = false;
    private _commitError: ((failure: Failure) => void) | null = null;

    private _buildFullUrl = (url: string) => {
        return this._baseUrl + url
    };

    private _handleAxiosResponse(promise: Promise<AxiosResponse>) {
        return promise.then((response: AxiosResponse) => {
            const success = response && response.data;
            return success.data
        }).catch((e: AxiosError<Failure>) => {
            return this._handleError(e)
        });
    }

    _handleError = (e: AxiosError<Failure>) => {
        console.log(e);
        if (e.response && e.response.data) {
            const failure = e.response && e.response.data;
            if (this._commitError) {
                this._commitError(failure);
            } else if (!this._ignoreErrors) {
                const firstError = failure.errors[0];
                throw new Error(firstError.detail ? firstError.detail : firstError.error);
            }
        } else if (!this._ignoreErrors) {
            throw new Error("Could not parse API response")
        }
    };

    commitFirstError = (commit: Commit, type: string) => {
        this._commitError = (failure: Failure) => {
            const firstError = failure.errors[0].detail;
            commit({type: type, payload: firstError});
        };
        return this
    };

    ignoreErrors = () => {
        this._ignoreErrors = true;
        return this;
    };

    async get<T extends ResponseData>(url: string): Promise<void | T> {
        const fullUrl = this._buildFullUrl(url);
        console.log(`GET ${fullUrl}`);
        return this._handleAxiosResponse(axios.get(fullUrl));
    }

    async postAndReturn<T extends ResponseData>(url: string, data: any): Promise<void | T> {
        const fullUrl = this._buildFullUrl(url);
        console.log(`POST ${fullUrl}`);
        const config = typeof data.getHeaders == "function" ? {
            headers: data.getHeaders()
        } : {};
        return this._handleAxiosResponse(axios.post(fullUrl, data, config));
    }

}

export const api = () => new APIService();