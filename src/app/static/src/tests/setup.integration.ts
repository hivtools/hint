import axios from 'axios';
import {integrationAppUrl} from "./integrationAppUrl";

axios.defaults.adapter = require('axios/lib/adapters/http');

(global as any).appUrl = integrationAppUrl;
