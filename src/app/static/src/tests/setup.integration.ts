import axios from 'axios';
import {integrationAppUrl} from "./integrationAppUrl";

axios.defaults.adapter = axios.getAdapter("http");

(global as any).appUrl = integrationAppUrl;
