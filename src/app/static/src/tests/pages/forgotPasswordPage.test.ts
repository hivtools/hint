const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '../../../templates/forgot-password.ftl'), 'utf8');

document.documentElement.innerHTML = html.toString();
document.getElementById("app")!!.setAttribute("title", "AppTitle");

import {forgotPasswordApp} from "../../app/forgotPassword";

describe('forgot password page', function () {

    it("passes title to app", () => {
        let c = forgotPasswordApp.$options;
        expect(document.body.getElementsByClassName("navbar-header").item(0)!!.textContent!!.trim())
            .toBe("AppTitle")
    });

});
